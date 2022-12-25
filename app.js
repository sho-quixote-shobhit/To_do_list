const _ = require("lodash");
const mongoose = require("mongoose");
const { username, password } = require("./config");
mongoose.set("strictQuery", true);
mongoose
  .connect(
    `mongodb+srv://${username}:${password}@cluster0.tzlk5o9.mongodb.net/todoDB`,
    { useNewUrlParser: true }
  )
  .then(() => {
    console.log("success");
  })
  .catch((err) => {
    console.log(err);
  });

const itemschema = new mongoose.Schema({
  name: String,
});
const Item = mongoose.model("Item", itemschema);

const listschema = new mongoose.Schema({
  name: String,
  items: [itemschema],
});
const List = mongoose.model("List", listschema);

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 3000 || process.env["PORT"];

app.use(express.static("public"));

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

const today = new Date();
const option = {
  weekday: "long",
  day: "numeric",
  month: "long",
};
const date = today.toLocaleDateString("en-US", option);

app.get("/", (req, res) => {
  Item.find({}, (err, items) => {
    if (err) console.log(err);
    else {
      res.render("list", { key: date, newitems: items });
    }
  });
});

app.get("/:list", (req, res) => {
  const customlisttitle = _.lowerCase(req.params.list);

  List.findOne({ name: customlisttitle }, async (err, foundlist) => {
    if (!err) {
      if (!foundlist) {
        const list = new List({
          name: customlisttitle,
          items: [],
        });
        await list.save();
        res.redirect("/" + customlisttitle);
      } else {
        res.render("list", { key: foundlist.name, newitems: foundlist.items });
      }
    }
  });
});

app.post("/", async (req, res) => {
  const task = req.body.task;
  const listname = req.body.list;
  const newtask = new Item({
    name: task,
  });
  if (listname === date) {
    await newtask.save();
    res.redirect("/");
  } else {
    await List.findOne({ name: listname }, async (err, foundone) => {
      if (!err) {
        foundone.items.push(newtask);
        await foundone.save();
        res.redirect("/" + listname);
      }
    });
  }
});

app.post("/delete", (req, res) => {
  const checked_item_id = req.body.checkbox;
  const listname = req.body.listname;

  if (listname === date) {
    Item.findByIdAndRemove(checked_item_id, (err) => {
      if (!err) res.redirect("/");
    });
  } else {
    List.findOneAndUpdate(
      { name: listname },
      { $pull: { items: { _id: checked_item_id } } },
      (err, docs) => {
        if (!err) res.redirect("/" + listname);
      }
    );
  }
});

app.listen(port, () => {
  console.log(`Server is running at port ${port}`);
});
