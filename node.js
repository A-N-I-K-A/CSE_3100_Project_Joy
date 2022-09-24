var express = require('express');
var app = express();
var server = express();
var port = 2000;
var area = "";


const path = require('path');
const {
  unwatchFile,
  rmSync,
  readSync
} = require('fs');


//intialize body-parser

var bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({
  extended: false
});

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({
  extended: false
})); // support encoded bodies



app.use(express.static(__dirname + '/public'));

//start view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");



//connecting to the database
var db = require('./database');
const {
  render
} = require('ejs');
const {
  count
} = require('console');


//connnecting to server and rendering pages

//render home page
app.get("/", function(req, res) {
  res.render("home");
});


//render blogs page
app.get("/blogs", function(req, res) {
  res.render("blogs");
});


//render consultants list
app.get("/consultants", function(req, res) {
  
  //show all doctors 
  var str = "select * from doctor_list ";

  db.query(str, function(error, data, fields) {
    if (!!error) {
      console.log('Error in the query', error);
    } else {
      res.render("consultants-list", {
        userData: data
      });
    }
  });
});


//get the search request for an area and show result
app.post("/consultants", urlencodedParser, function(req, res) {
  
  console.log(req.body);
  area = req.body.location;

  if (req.body.id_to_add != undefined) {
    var id_to_add = req.body.id_to_add;
    res.render("add", {
      id_to_add: id_to_add
    });
  }

  var str;

  if (area == '') {
    str = "select * from doctor_list";
  } else {

    //select from a specific area
    str = "select * from doctor_list where Area= '" + area + "'";
  }

  db.query(str, function(error, data, fields) {
    if (!!error) {
      console.log('Error in the query', error);
    } else {
      res.render("consultants-list", {
        userData: data
      });
    }
  });

});

//show profile
app.get('/profile', function(req, res) {
  res.render('profile');
});


app.post("/profile", urlencodedParser, function(req, res) {

  console.log(req.body);

  //the user wants to delete a doctor from the list
  var deleteQuery = 'delete from user_doctor_list where user_id= ' + req.body.from_id + ' and doctor_id= ' + req.body.id_to_delete;

  console.log(deleteQuery);

  if (req.body.id_to_delete != undefined) {
    db.query(deleteQuery, function(error, data, fields) {
      if (!!error) {
        console.log('Error occured', error);
      } else {
        console.log('Delete succesfully');

        //get all the doctors that the user added
        var selectQuery = 'select * from doctor_list where doctor_id in(select doctor_id from user_doctor_list where user_id=' + req.body.from_id + ')';
        db.query(selectQuery, function(error, data, fields) {
          if (!!error) {
            console.log('Error occured', error);
          } else {

            //getting the user information
            var userSelect = 'select * from user_list where user_id=' + req.body.from_id;
            db.query(userSelect, function(error, userInfo, fields) {
              if (!!error) {
                console.log('Error occured', error);
              } else {

                //rendering the profile again
                res.render('profile', {
                  userInfo: userInfo,
                  doctorData: data
                });
              }
            });
          }
        });

      }
    });
  } 

  //user wants to delete his/her id
  else if (req.body.delete_id != undefined) {


    //delete all the data of the user
    var deletedata = 'delete from user_doctor_list where user_id=' + req.body.delete_id;
    var deleteID = 'delete from user_list where user_id=' + req.body.delete_id;


    db.query(deletedata, function(error, row, fields) {
      if (!!error) {
        console.log('Error occured', error);
      } else {
        db.query(deleteID, function(error, data, fields) {
          if (!!error) {
            console.log("Error occured", error);
          } else {
            res.render('error404', {
              text: 'Account Deleted !'
            });
          }
        });
      }
    });
  }
});


//add doctor in user's own list 
app.post("/add", urlencodedParser, function(req, res) {

  console.log(req.body);


  //check if the user credentials are correct
  var check = 'select user_pass from user_list where user_id=' + req.body.user_id;

  //if the user exist then fetch his/her profile from database
  var cnt = 'select count(user_id) as cnt_user from user_list where user_id=' + req.body.user_id;
  var ok;


  db.query(cnt, function(error, rows, fields) {
    if (!!error) {
      console.log("error occured", error);
    } else {
      if (rows[0].cnt_user == 0) {
        res.render('error404', {
          text: 'Invalid User ID or Password'
        });
      } else {
        db.query(check, function(error, row, fields) {
          if (!!error) {
            res.render('error404', {
              text: 'Error occured'
            });
          } else {

            if (row[0].user_pass == req.body.pass) {
              var insert_str = "insert into user_doctor_list values('" + req.body.user_id + "','" + req.body.doctor_id + "');";

              console.log(insert_str);
              db.query(insert_str, function(error, data, fields) {
                if (!!error) {
                  res.render('error404', {
                    text: 'Error Occured'
                  });

                } else {

                  res.render('after_add');

                }
              });
            } else {
              res.render('error404', {
                text: 'Invalid Handle or Password'
              });
            }
          }
        });


      }
    }
  })
});


//render login page
app.get("/login", function(req, res) {
  res.render("login");
});


//render sign up page
app.get("/signup", function(req, res) {
  res.render("signup");
});


app.post("/login", urlencodedParser, function(req, res) {
  
  console.log(req.body);
  var pass = req.body.user_pass;

  var loginQuery;


  //query to see if this user exist or not
  loginQuery = "select count(user_id) as cnt from user_list as cnt where user_id='" + req.body.user_handle + "'";

  db.query(loginQuery, function(error, data, fields) {
    if (!!error) {
      console.log("Error occured!", error);
    } else {
      console.log(data);

      //no such user
      if (data[0].cnt == 0) {
        res.render('error404', {
          text: 'Invalid handle or password'
        });
      } else {
        var passQuery = "select user_pass as up from user_list where user_id='" + req.body.user_handle + "'";

        db.query(passQuery, function(error, rows, fields) {
          if (!!error) {
            console.log("Error Occured", error);
          } else {
            console.log(rows);

            //if the entered password is correct
            if (rows[0].up == pass) {

              //getting all the information about the user who logged in
              var nameQuery = "select * from user_list where user_id=" + req.body.user_handle;
              var doctorQuery = 'select * from doctor_list where doctor_id in(select doctor_id from user_doctor_list where user_id=' + req.body.user_handle + ")";

              db.query(doctorQuery, function(error, data, fields) {
                if (!!error) {
                  console.log('Error occured', error);
                } else {
                  console.log(data);
                  db.query(nameQuery, function(error, userInfo, fields) {
                    if (!!error) {
                      console.log('Error occured', error);
                    } else {
                      console.log(userInfo[0].user_name);
                      res.render('profile', {
                        userInfo: userInfo,
                        doctorData: data
                      });

                    }
                  });
                }
              });
            } 

            //the entered password is not correct
            else {
              console.log('Invalid user ID or password');
              res.render('error404', {
                text: 'Invalid user ID or password '
              });
            }
          }
        });


      }
    }
  });


});
app.post("/signup", urlencodedParser, function(req, res) {

  console.log(req.body);

  var signUpQuery;
  var countQuery;

  //to see if the user handle already belongs to an user
  countQuery = 'select count(user_id) as cnt from user_list where user_id="' + req.body.user_handle + '"';
  console.log(countQuery);
  db.query(countQuery, function(error, data, fields) {

    if (!!error) {
      console.log('Error in the query', error);
    } else {
      console.log(data[0].cnt);
      if (data[0].cnt != 0) {
        res.render('error404', {
          text: 'Handle already taken! Please try another time.'
        });
      } else {

        //insert all the sign up data into pending 
        signUpQuery = "insert into pending values ('" + req.body.user_name + "','" + req.body.user_handle + "','" + req.body.user_pass + "','" + req.body.user_email + "','" + req.body.user_phone + "')";
        console.log(signUpQuery);

        db.query(signUpQuery, function(error, data, fields) {
          if (!!error) {
            console.log('Error occured', error);
          } else {
            res.render('error404', {
              text: 'Sign Up request has been sent!'
            });
          }
        });

      }
    }
  });

});


app.listen(2000, function() {
  console.log('Server listening to port ' + port);
});
