var express = require('express');
var app = express();
var server = express();
var port = 4000;
const nodemailer = require("nodemailer");

const path = require('path')
const {
  unwatchFile,
  rmSync,
  readSync
} = require('fs');

//bodyparser initalize
var bodyParser = require("body-parser")
var urlencodedParser = bodyParser.urlencoded({
  extended: false
});


app.use(express.static(__dirname + '/public'));
app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs")


//connecting to the database
var db = require('./database');
const {
  render
} = require('ejs');
const {
  count
} = require('console');

//log in before entering the admin panel
app.get("/", function(req, res) {
  res.render("adminAccess")
})

app.get("/adminAccess",function(req,res){
  res.render('adminAccess');
})

app.post("/adminAccess", urlencodedParser, function(req, res) {
  var ID = req.body.ID;
  var pass = req.body.pass;

  if (ID == 'anika' && pass == '1234') {
    res.render('adminHome');
  } else {
    console.log('wrong password');
    res.render('error404adminaccess', {
      text: 'Wrong password or ID '
    });
  }
})



//admin home
app.get("/adminHome",function(req,res){
  res.render('adminHome');
})

//edit consultants list
app.get("/edit", function(req, res) {


  //show all the doctors list
  var str = "select * from doctor_list ";

  db.query(str, function(error, data, fields) {
    if (!!error) {
      console.log('Error in the query', error);
    } else {
      
      res.render("edit", {
        userData: data
      });
    }
  });
});



app.post("/edit", urlencodedParser, function(req, res) {

  var area = '';
  area = req.body.location;


  if (req.body.delete != undefined) {

    console.log(req.body.id_to_delete);

    //delete a doctor

    var strDelete = 'Delete from doctor_list where doctor_id=' + req.body.id_to_delete;

    db.query(strDelete, function(error, data, fields) {
      if (!!error) {
        console.log("error orccured", error);
      } else {
       
        res.render('after_deletion');
      }

    });

  } else {
    var str;


    //if the area field empty show all
    if (area == '') {
      str = "select * from doctor_list";
    } 
    
    //else show only result from an area
    else {
      str = "select * from doctor_list where Area= '" + area + "'";
    }

    db.query(str, function(error, data, fields) {
      if (!!error) {
        console.log('Error in the query', error);
      } else {
        res.render("edit", {
          userData: data
        });
      }
    });
  }

})


//render the edit-add page to insert a new doctor 
app.get("/edit-add", function(req, res) {
  res.render('edit-add');
});

app.post("/edit-add", urlencodedParser, function(req, res) {

  console.log(req.body);


  //insert the new doctor details
  var strAdd = "insert into doctor_list (doctor_id,Name,Area,Address,Contact) values ( " + req.body.doctor_id + ",'" + req.body.Name + "','" + req.body.Area + "','" + req.body.Address + "','" + req.body.Contact + "')";
  console.log(strAdd);


  db.query(strAdd, function(error, data, fields) {
    if (!!error) {
      res.render('error404foradmin', {
        text: 'Error orccured !'
      });
    } else {
      res.render('after-edition');
    }
  });
});



// the pending page
app.get('/pending', function(req, res) {
  var strshow = 'select * from pending';

  db.query(strshow, function(error, data, fields) {
    if (!!error) {
      console.log("Error occured", error);
    } else {
      res.render('pending', {
        userData: data
      });
    }
  })
});


app.post('/pending', urlencodedParser, function(req, res) {

  console.log(req.body);

  //approve the user
  if (req.body.approve != undefined) {

    //shift the user information into user list
    var approvestr = 'insert into user_list (user_id,user_pass,user_name,user_phone,user_email) values(' + req.body.user_id + "," + req.body.user_pass + ",'" + req.body.user_name + "'," + req.body.user_phone + ",'" + req.body.user_email + "')";
    console.log(approvestr);


    db.query(approvestr, function(error, data, fields) {
      if (!!error) {
        console.log('Error occured', error);
      } else {


        //and delete the user from pending list
        var deletequery = 'delete from pending where user_handle=' + req.body.user_id;

        db.query(deletequery, function(error, row, fields) {
          if (!!error) {
            console.log('Error occured', error);
          } else {

            //now give an approve notification through email
            const output = `Your request has been approved approved.Now you can log into your account using the handle and password.`;

            let transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: 'ProjectJoy22@gmail.com', // generated ethereal user
                pass: 'phynatuirovkopca', // generated ethereal password
              },
              tls: {
                rejectUnauthorized: false
              }

            });

            // send mail with defined transport object

            let mailOptions = {
              from: '"Project Joy" <ProjectJoy22@gmail.com>', // sender address
              to: req.body.user_email, // list of receivers
              subject: "Request approved", // Subject line
              text: "Hello world?", // plain text body
              html: output, // html body
            };

            transporter.sendMail(mailOptions, function(error, info) {
              if (!!error) {
                console.log('Error occured', error);
              } else {
                console.log("Message sent");
              }
            });


            res.redirect('pending');
          }
        });

      }
    });

  }
  //reject the user
  else if(req.body.reject!=undefined){

    //delete the request
    var rejectstr='delete from pending where user_id='+req.body.user_id;

    db.query(rejectstr,function(error,data,fields){
      if(!!error){
        console.log("Error occured",error);
      }
      else{
        res.redirect('pending');
      }
    })
  }

  else {

    //show all the pending request
    var strshow = 'select * from pending';

    db.query(strshow, function(error, data, fields) {
      if (!!error) {
        console.log("Error occured", error);
      } else {
        res.render('pending', {
          userData: data
        });
      }
    })
  }
});




app.listen(4000, function() {
  console.log('Server listening to port ' + port)
})
