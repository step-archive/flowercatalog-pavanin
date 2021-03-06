let fs = require('fs');
const http = require('http');
const timeStamp = require('./time.js').timeStamp;
const WebApp = require('./webapp');
let registered_users=[{"userName":"pavani"},{"userName":"dhanusha"}];

let getContentType=function(url){
  let extention=url.substr(url.lastIndexOf("."));
  let fileHeaders={
    ".html":{contentType:"text/html"},
    ".jpg":{contentType:"image/jpg"},
    ".jpeg":{contentType:"image/jpeg"},
    ".css":{contentType:"text/css"},
    ".gif":{contentType:"image/gif"},
    ".pdf":{contentType:"application/pdf"},
  }
  return fileHeaders[extention];
}

let logRequest = (req,res)=>{
  let text = ['------------------------------',
    `${timeStamp()}`,
    `${JSON.stringify(req.method,null,2)} ${JSON.stringify(req.url,null,2)}`,
    `HEADERS=> ${JSON.stringify(req.headers,null,2)}`,
    `COOKIES=> ${JSON.stringify(req.cookies,null,2)}`,
    `BODY=> ${JSON.stringify(req.body,null,2)}`,''].join('\n');
  fs.appendFile('request.log',text,()=>{});
  console.log(`${req.method} ${req.url}`);
};

let loadUser = (req,res)=>{
  let sessionid = req.cookies.sessionid;
  let user = registered_users.find(u=>u.sessionid==sessionid);
  if(sessionid && user){
    req.user = user;
  }
};

let serveFileContent= (req,res)=>{
  if(fs.existsSync("./public"+req.url)){
    app.get(req.url,(req,res)=>{
      res.setHeader('Content-type',getContentType(req.url));
      contents=fs.readFileSync("./public"+req.url);
      res.write(contents);
      res.end();
    })
  };
}

let redirectToIndexPage=function(req,res){
  if(req.url=="/") res.redirect("/index.html");
}


let toHtml= function(comment){
  return `<p>${comment.DATETIME} , ${comment.USERNAME} , ${comment.COMMENT}. </p>`;
};

let arrangeComments= function(comments){
  return comments.map(toHtml).join("");
};

let getComments=()=>{
  comments=fs.readFileSync("./dataBase/comments.json");
  comments=JSON.parse(comments);
  comments=arrangeComments(comments);
  return comments;
};

let addComment=(comment)=>{
  let commentsData=fs.readFileSync("./dataBase/comments.json");
  commentsData=JSON.parse(commentsData);
  commentsData.unshift(comment);
  commentsData=JSON.stringify(commentsData);
  fs.writeFileSync("./dataBase/comments.json",commentsData,"utf8");
};


let getCommentDetails= function(data){
  let details={}
  details=data;
  details["DATETIME"]=timeStamp();
  return details;
}

let app = WebApp.create();
app.use(logRequest);
app.use(loadUser);
app.use(redirectToIndexPage);
app.use(serveFileContent);
app.post("/submit",(req,res)=>{
  console.log(req.user);
  let user = req.body.USERNAME;
  if(!req.user) {
    res.setHeader('Set-Cookie',`logInFailed=true`);
    res.redirect('./guestbook.html')
    return;
  }
  let comment=getCommentDetails(req.body);
  addComment(comment);
  fs.writeFileSync("./public/comments.html",getComments(),"utf8");
  res.redirect('./guestbook.html');
});

app.get("/logout",(req,res)=>{
  res.setHeader('Set-Cookie',`logInFailed=false; Expires${new Date(1).toUTCString()}`);
  res.setHeader('Set-Cookie',`sessionid=0; Expires${new Date(1).toUTCString()}`);
  if(req.user)
    delete req.user.sessionid;
  res.redirect('./login.html');
});

app.post("/login",(req,res)=>{
  let user = registered_users.find(u=>u.userName==req.body.userName);
  if(!user) {
    res.setHeader('Set-Cookie',`logInFailed=true`);
    res.redirect('./login.html');
    return;
  }
  let sessionid = new Date().getTime();
  res.setHeader('Set-Cookie',`sessionid=${sessionid}`);
  user.sessionid = sessionid;
  res.redirect('./guestbook.html');
})

const PORT = 9000;
let server = http.createServer(app);
server.on('error',e=>console.error('**error**',e.message));
server.listen(PORT,(e)=>console.log(`server listening at ${PORT}`));
