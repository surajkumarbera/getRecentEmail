const express = require("express");
const showRecentEmail = require("./emailApi");

const app = express();

app.get("/api/email/recent", (req,res) => {
        const mail = showRecentEmail();
        mail.then( data => {
                res.send(data);
        })
});

const PORT = process.env.PORT || 3000;
const IP = "127.0.0.1";
app.listen(PORT, IP, (err) => {
        if(err) console.log(arr);
        else console.log("Listening...");
});