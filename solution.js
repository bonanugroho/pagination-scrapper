// const request = require('request');
const request = require("request-promise");
const cheerio = require('cheerio');
const fs = require('fs');
const { resolve } = require("path");

const baseUrl = "https://www.bankmega.com";
const listUrl = `${baseUrl}/ajax.promolainnya.php?product=0`;
const startingPage = "1";

const subcat = [
    {
        id: "travel",
        title: "Travel",
        subcatId: 1
    },
    {
        id: "lifestyle",
        title: "Lifestyle",
        subcatId: 2
    },
    {
        id: "fnb",
        title: "Food & Beverages",
        subcatId: 3
    },
    {
        id: "gadget_entertainment",
        title: "Gadget & Entertainment",
        subcatId: 4
    },
    {
        id: "dailyneeds",
        title: "Daily Needs",
        subcatId: 5
    },
    {
        id: "others_promo",
        title: "Others",
        subcatId: 6
    },
];


async function extractDetailPromo(promoDetailUrl) {

    const detailResult = await request.get(promoDetailUrl)
    var $detailBody = cheerio.load(detailResult);

    const title = $detailBody("#contentpromolain2 > div.titleinside > h3")
        .text();
    const area = $detailBody("#contentpromolain2 > div.area > b")
        .text();
    const periode = $detailBody("#contentpromolain2 > div.periode > b:nth-child(1)")
        .text() + 
        $detailBody("#contentpromolain2 > div.periode > b:nth-child(2)")
        .text();
    const imageurl = baseUrl + $detailBody("#contentpromolain2 > div.keteranganinside > img")
        .attr("src");

    let item = { title, area, periode, imageurl, promoDetailUrl };

    return new Promise((resolve) => {
        resolve(item);
    })
}

async function extractPromos(promoUrl, subCategory){
    const result = await request.get(promoUrl);
    var $body = cheerio.load(result);
    let promosOnPage = [];

    let catName = subCategory.title;
    
    $body("#promolain li a").each( (index,element) => {
        const title = $body(element)
        .children("#imgClass")
        .attr("title");
        const detailUrl = `${baseUrl}/` + $body(element)
        .attr("href");
        
        promosOnPage.push({title, detailUrl, catName});
        // console.log("title=" + title + " url=" + detailUrl);
    })
    
    // get by page recursively
    if (promosOnPage < 1 && subcat.length < 1) {
        // Terminate no result
        return new Promise((resolve) => {
            console.log("Stops ...");
            resolve(promosOnPage); 
        });
    } 
    if (promosOnPage < 1 && subcat.length >= 1) {
        let newSubCat = subcat.pop();
        const nextUrl = `${listUrl}&subcat=${newSubCat.subcatId}&page=${startingPage}`;
        console.log("Using New Category - " + nextUrl);
        return new Promise((resolve,reject) => {
            extractPromos(nextUrl, newSubCat)
            .then((resolvePromoOnPage) => {
                resolve(promosOnPage.concat( resolvePromoOnPage ));
            })
            .catch((err)=>{
                reject(err);
            })
        });
    } 
    else {
        const nextPageNumber = parseInt(promoUrl.match(/page=(\d+)$/)[1], 10) + 1;
        const nextUrl = `${listUrl}&subcat=${subCategory.subcatId}&page=${nextPageNumber}`;
        console.log("Using current Category- " + nextUrl);
        return new Promise((resolve,reject) => {
            extractPromos(nextUrl, subCategory)
            .then((resolvePromoOnPage) => {
                resolve(promosOnPage.concat( resolvePromoOnPage ));
            })
            .catch((err)=>{
                reject(err);
            })
        });
    }    
}

async function main() {
    let startCategory = subcat.pop();
    const firstUrl = `${listUrl}&subcat=${startCategory.subcatId}&page=${startingPage}`;
    console.log("Starting - " + firstUrl);
    let promoResult = await extractPromos(firstUrl, startCategory);
    // console.log(promoResult);

    let no = 1;  
    let detailPromoList = {};
    var promises = [];
    var lastCatName = promoResult[0].catName
    detailPromoList[lastCatName] = []

    promoResult.forEach((element, index) => {
        // New Category will create new key
        if (element.catName != lastCatName) {
            lastCatName = element.catName;
            detailPromoList[element.catName] = [];
        }
        promises.push(
            extractDetailPromo(element.detailUrl)
                .then( resultItem => {
                    // console.log(resultItem);
                    detailPromoList[element.catName].push(resultItem);
                })

            // console.log(no + "> title=" + element.title + " url=" + element.detailUrl);
            // no++;
        );
    });


    Promise.all(promises)
        .then(() => {
            // console.log(detailPromoList);
            fs.appendFile('solution.json', JSON.stringify(detailPromoList), 'utf8', function (err) {
                if (err) throw err;
                console.log('Saved!');
            });

        });

    
}

main();
