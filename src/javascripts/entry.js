require("../stylesheets/entry");
require("expose?Interpreter!./components/interpreter");

import React from "react";
import { render } from "react-dom";
import Interpreter from "./components/interpreter"

const mountNode = document.getElementById("interpreter");

ReactDOM.render(
  <Interpreter />,
  mountNode
);
