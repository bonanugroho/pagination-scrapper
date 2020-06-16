# Web-pagination-scrapper

## Objective 
To write a credit card promotion scraper, which has pagination.

### Output
Expected result is to generate json file like :
```
The JSON file has a format like this:
{
“travel and entertainment”: [
{
title: "something",
imageurl: "http://something",
Other fields:
},
{
title: "sesuatu 2",
image: "url 2", etc.....
},
],
“lifestyle and wellness”: [
dll
],
Other categories etc....
}
```

### Solutions
Using Recursive to scrappe pagination until the page returning no value. 
Library using [Cheerio](https://github.com/cheeriojs/cheerio), 

