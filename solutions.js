// const request = require('request');
const request = require("request-promise");
const cheerio = require('cheerio');
const fs = require('fs');
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

// var resultItem = {title: null, detailUrl:null};

subcat.forEach(subcat => {
    console.log(subcat.subcatId + "> " + subcat.title);
});

/*
    const extractPromos =  url => {
        request(url, function(error, response, html) {
            let promosOnPage = [];
            
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(html);

                $("#promolain li a").each( (index,element) => {
                    // var item = {title : $(element).children("#imgClass").attr("title").toString(), detailUrl: $(element).attr("href").toString()}
                    // resultItem.title = $(element).children("#imgClass").attr("title");
                    // resultItem.detailUrl = $(element).attr("href");
                    const title = $(element)
                                .children("#imgClass")
                                .attr("title");
                    const detailUrl = $(element)
                                .attr("href");

                    promosOnPage[index] = {title, detailUrl};
                    // console.log("title=" + item.title + " url=" + item.detailUrl);

                })

                if (promosOnPage < 1) {
                    // Terminate no result
                    return promosOnPage;
                } else {
                    const nextPageNumber = parseInt(url.match(/page=(\d+)$/)[1], 10) + 1;
                    const nextUrl = `${listUrl}&subcat=3&page=${nextPageNumber}`;
        
                    return promosOnPage.concat(  extractPromos(nextUrl));
                }

            }

            console.log(promosOnPage) ;
        });
    }

   */

async function main() {
    const extractPromos = async url => {
        const result = await request.get(url);
        var $ = cheerio.load(result);
        let promosOnPage = [];

        $("#promolain li a").each( (index,element) => {
            const title = $(element)
                .children("#imgClass")
                .attr("title");
            const detailUrl = $(element)
                .attr("href");

            promosOnPage[index] = {title, detailUrl};
            // console.log("title=" + title + " url=" + detailUrl);
        })

        if (promosOnPage < 1) {
            // Terminate no result
            return promosOnPage;
        } else {
            const nextPageNumber = parseInt(url.match(/page=(\d+)$/)[1], 10) + 1;
            const nextUrl = `${listUrl}&subcat=3&page=${nextPageNumber}`;
            return promosOnPage.concat( await extractPromos(nextUrl));
        }
    }

    const firstUrl = `${listUrl}&subcat=3&page=1`;

    let promoResult = await extractPromos(firstUrl);

    let no = 1;
    promoResult.forEach(element => {
        console.log(no + "> title=" + element.title + " url=" + element.detailUrl);
        no++;
    });

    console.log(promoResult.length);
}

main();
