//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const _= require("lodash");
//1.先导入mongoose包
const mongoose = require("mongoose");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//2.再让mongoose连接到接口(注意！最后一个参数要根据项目不同而变化，这里是blogDB)
mongoose.connect("mongodb://localhost:27017/todolistDB");

//3.然后定义数据结构
const itemsSchema = new mongoose.Schema({
  name:String
})

//4.通过创建的数据结构来创建一个新的mongoose model
//只要是涉及到mongoose model都要大写
const Item = mongoose.model("Item",itemsSchema);

//5.创建新的model实例
const item1 = new Item({
  name:"welcome to your todolist!",
});
const item2 = new Item({
  name:"Hit the + button to add a new item."
});
const item3 = new Item({
  name:"<-- Hit this to delete an item."
});
//6.创建一个array来装所有的item
const defaultItems = [item1,item2,item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List",listSchema)


const items = ["Buy Food", "Cook Food", "Eat Food"];


app.get("/", function(req, res) {
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      //7.把所有的item放入数据库
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err)
        } else {
          console.log("successfull!")
        }
      });
      //为什么这里需要redirect？
      //因为第一次渲染不会把刚刚存入数据库的数据渲染到页面上
      //所以需要重新导入一下
      res.redirect('/');
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  })
});

app.get("/:customListName",function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  // list.save()
  List.findOne({name:customListName},function(err,foundList){
    if(!err){
      if(!foundList){
        //create a new list
        const list = new List({
          name:customListName,
          items: defaultItems
        });
        list.save()
        res.redirect("/" + customListName)
      }else{
        //show an existing list
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items })
    }
  }
  })
})

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list

  const item = new Item({
    name: itemName,
  });

  if(listName === "Today"){
    item.save()
    res.redirect("/")
  }else{
    List.findOne({name:listName},function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName)
    })
  }
});

app.post("/delete",function(req,res){
  const checkItemId = req.body.checkbox
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkItemId,function(err){
      if(!err){
        console.log("successfully deleted checked item!!!")
        res.redirect("/")
      };
    })
  }else{
    List.findOneAndUpdate({name: listName},
      {$pull:{items:{_id:checkItemId}}},
      function(err,results){
        if(!err){
          res.redirect("/"+listName)
        }
    })
  }


})



app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
