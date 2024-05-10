require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

let mongoose;
try {
  mongoose = require("mongoose");
} catch (e) {
  console.log(e);
}
const bodyParser = require("body-parser");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());

mongoose.connect(process.env.URI, { useNewUrlParser: true, useUnifiedTopology: true });

const urlSchema = new mongoose.Schema({
  url: {
    type: String, 
    required: true
  },
  short: Number
})

const url = mongoose.model('url', urlSchema)

let responseObj = {}
const validUrl = require('valid-url');

app.post("/api/shorturl", function (req,response){
  const inputURL = req.body.url
  // Check if the input URL is valid
  if (!validUrl.isWebUri(inputURL)) {
    return response.json({ error: 'invalid url' });
  }

  let inputShort = 1
  url.findOne({}).sort({short:'desc'}).exec((err,res)=>{
    if (!err && res){
      inputShort = res.short + 1;
    } 
    if (!err){
      url.findOneAndUpdate({url: inputURL}, {
        url: inputURL,
        short: inputShort
      }, {
        new:true,
        upsert: true
      }, function(err,result){
        if (err){
          console.log(err)
        }
        else{
          responseObj["original_url"] = inputURL
          responseObj["short_url"] = result.short
          response.json(responseObj)
        }
      }
  )}
  })
})

app.get("/api/shortURL/:short_URL", function(req,response){
  const short = req.params.short_URL
  url.findOne({short: short}, (err,res)=>{
    if (err){
      console.log(err)
    }
    else{
      response.redirect(res.url)
    }
  })
})

