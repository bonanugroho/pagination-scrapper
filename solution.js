// const request = require('request');
const request = require("request-promise");
const cheerio = require('cheerio');
const fs = require('fs');
const { resolve } = require("path");

const baseUrl = "https://www.bankmega.com";
const listUrl = `${baseUrl}/ajax.promolainnya.php?product=0`;

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

// subcat.forEach(subcat => {
//     console.log(subcat.subcatId + "> " + subcat.title);
// });

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

    // console.log(title + " " + area + " " + periode + " " + imageurl);
    let item = { title, area, periode, imageurl, promoDetailUrl };

    // console.log(item);
    // return item;

    return new Promise((resolve) => {
        resolve(item);
    })
}

async function extractPromos(promoUrl){
    const result = await request.get(promoUrl);
    var $body = cheerio.load(result);
    let promosOnPage = [];
    
    $body("#promolain li a").each( (index,element) => {
        const title = $body(element)
        .children("#imgClass")
        .attr("title");
        const detailUrl = `${baseUrl}/` + $body(element)
        .attr("href");
        
        // let item = await extractDetailPromo(detailUrl);
        // promosOnPage[index] = item;
        // promosOnPage.push(item);

        // extractDetailPromo(detailUrl)
        //     .then( resultItem => {
        //         // console.log(resultItem);
        //         promosOnPage.push(resultItem);
        //     })

        
        promosOnPage.push({title, detailUrl});
        // console.log("title=" + title + " url=" + detailUrl);
    })
    
    // get by page recursively
    if (promosOnPage < 1) {
        // Terminate no result
        // return promosOnPage;
        return new Promise((resolve) => {
            resolve(promosOnPage); 
        });
    } else {
        const nextPageNumber = parseInt(promoUrl.match(/page=(\d+)$/)[1], 10) + 1;
        const nextUrl = `${listUrl}&subcat=3&page=${nextPageNumber}`;
        // return promosOnPage.concat( await extractPromos(nextUrl));
        return new Promise((resolve,reject) => {
            extractPromos(nextUrl)
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
    const firstUrl = `${listUrl}&subcat=3&page=1`;

    let promoResult = await extractPromos(firstUrl);
    // extractPromos(firstUrl)

    // Promise.all([extractPromos(firstUrl)])
    // .then(([promoResult]) => {
    //     console.log("length = " + promoResult.length);
    // })
    // .catch(([err]) => {
    //     console.log(err);
    // })

    // extractPromos(firstUrl)
    // .then(promoResult => {
    //     console.log(promoResult.length);
    // })


    let no = 1;  
    let detailPromoList = {'fnb':[]};
    var promises = [];
    promoResult.forEach(element => {
        promises.push(
            extractDetailPromo(element.detailUrl)
                .then( resultItem => {
                    // console.log(resultItem);
                    detailPromoList['fnb'].push(resultItem);
                    // fs.appendFile('fnb.json', JSON.stringify(resultItem) + ',', function (err) {
                    //     if (err) throw err;
                    //     console.log(resultItem);
                    //   });
                })
            // detailPromoList['fnb'].push(await extractDetailPromo(element.detailUrl));

            // console.log(no + "> title=" + element.title + " url=" + element.detailUrl);
            // no++;
        );
    });


    Promise.all(promises)
        .then(() => {
            console.log(detailPromoList);
            fs.appendFile('fnb.json', JSON.stringify(detailPromoList), 'utf8', function (err) {
                if (err) throw err;
                console.log('Saved!');
            });

        });
    // console.log(promoResult.length)
    // detailPromoList.forEach(element => {
    //     console.log(no);
    //     console.log(element);
    //     no++;
    // })

    // console.log(promoResult.length);
}

main();
