var express=require('express')
var router=express.Router();
var db=require('../database')
router.get('/consultants-list',function(req,res,next){
    console.log('running');
    var sql='SELECT * FROM list';
    db.query(sql,function(err,data,fields){
        if(err){
            throw err;
        }
        else{
            
            res.render('consultants-list',{title:'Consultants',userData:data});
        }
    });
    
});
module.exports=router;