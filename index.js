var rss  = require('rss');
var feed = require("feed-read");
var rrequest = require("request");
var cheerio = require("cheerio");
var async = require("async");
var Hapi = require('hapi');
var server = new Hapi.Server();
server.connection({ port: 8888 });

server.route({
    path: "/",
    method: "GET",
    handler: returnCustomizedFeed
});

server.start(function() {
    console.log("Hapi server started @", server.info.uri);
});

function returnCustomizedFeed(request, reply) {
    feed("http://feeds.feedburner.com/Techcrunch", function(err, articles) {
        if (err) throw err;
        var feedInfo = articles[0].feed;
        console.log(feedInfo);
        async.map(articles, function(article, callback) {
            article.content = "";
            rrequest(article.link, function (error, response, html) {
                if (!error && response.statusCode == 200) {
                    $ = cheerio.load(html);

                    article.content = $(".article-entry").toString();
                    callback(err, article);
                }
            });
        }, function(err, results) {
            if( err ) {
                console.log('Shit just happened');
            } else {
                var feedOptions = {};
                feedOptions.title = feedInfo.name + " customized";
                feedOptions.site_url = feedInfo.link;
                feedOptions.site_url = feedInfo.link;
                var feed = new rss(feedOptions);

                results.forEach(function(result){
                    var itemOptions = {};
                    itemOptions.title = result.title
                    itemOptions.description = result.content
                    itemOptions.date = result.published
                    itemOptions.author = result.author
                    itemOptions.url = result.link

                    feed.item(itemOptions);
                });

                reply(feed.xml({indent: true}));
            }
        });
    });
}