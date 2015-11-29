require("../stylesheets/entry");
require("expose?Interpreter!./components/interpreter");
require("./jquery-linedtextarea");

import React from "react";
import { render } from "react-dom";
import Interpreter from "./components/interpreter"

const mountNode = document.getElementById("interpreter");

ReactDOM.render(
  <Interpreter />,
  mountNode
);

// line numbers for editor
$(() => {
  $(".editor").linedtextarea();
});
