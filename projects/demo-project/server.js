const express=require("express");
const app=express();
app.get("/", (req,res)=>res.send("<h1 style='font-family:sans-serif;text-align:center;margin-top:60px'>Hello Shubham! 🚀<br>V7 Preview Works!</h1>"));
app.listen(4000, ()=>console.log("Server on 4000 ✅"));
