import React from "react";

export default class Interpreter extends React.Component {
  static propTypes = {};
  static defaultProps = {};

  constructor(props) {
      super(props);
      this.state = {
          defaultCode: "INT 2\nINT 3\nADD\nPRINT",
          instructions: [],
          stack: [],
          pc: 0,
          output: "",
          status: "Ready",
          statusClass: "label label-primary",
      };
      this._load = this._load.bind(this);
      this._run = this._run.bind(this);

  }

  render() {
    return (
      <div>
      <div className="row">
        <div className="col-md-8 main">
          <h4>Editor</h4>
          <textarea className="editor"
                    rows="10"
                    defaultValue={this.state.defaultCode}
                    ref="sourceCode"
          ></textarea>
          <small>Implemented so far: INT, ADD, PRINT</small>
          <div className="buttons">
          <button className="btn btn-info" onClick={this._load}>Load</button>
          <button className="btn btn-warning" onClick={this._run}>Run</button>
          </div>
        </div>
        <div className="col-md-4 side">
          <span className={this.state.statusClass}>{this.state.status}</span>
          <h5>PC: <span className="monospace">{this.state.pc}</span></h5>
          <h5>Stack: </h5>
          <p className="monospace">{JSON.stringify(this.state.stack)}</p>
          <h5>Loaded instructions:</h5>
          <p className="monospace">{JSON.stringify(this.state.instructions)}</p>
          <h5>Output</h5>
          <pre className="monospace">{this.state.output}</pre>
        </div>
      </div>
      </div>
    );
  }

  _load() {
    //reset ui
    this.setState({
      output: "",
      stack: [],
      pc: 0
    });
    let errorFlag = false;
    let srctext = this.refs.sourceCode.value;
    let lines = srctext.match(/[^\r\n]+/g);
    let inst = [];

    for(let i = 0; i < lines.length; i++){
      let split = lines[i].split(" ");
      //add empty param if needed
      if(typeof split[1] === 'undefined'){
        split.push("");
      }
      split[1] = parseInt(split[1]) //convert string to int
      inst.push(split);
      //error check
      if(split.length > 2){
        errorFlag = true;
        this._update_status("Syntax Error: too many arguments on line " + (i+1));
        inst = [];
        break;
      }
    };

    if(!errorFlag){
      this._update_status("Loaded");
    }
    this.setState({
      instructions: inst
    });
  }

  _run() {
    let _stack = [];
    let _pc = 0;
    let errorFlag = false;
    let _output = "";

    while(true){
      let instruction = this.state.instructions[_pc][0];
      let param = this.state.instructions[_pc][1];
      switch(instruction) {
        case "INT":
          _stack.push(param);
          _pc++;
          break;
        case "ADD":
          let a = _stack.pop();
          let b = _stack.pop();
          _stack.push(a + b);
          _pc++;
          break;
        case "PRINT":
          _output = _output.concat(_stack[_stack.length - 1]).concat("\n");
          _pc++;
          break;
        default:
          errorFlag = true;
          this._update_status("Unknown instruction `" + instruction + "`");
          _pc = -1;
      }
      // check if we need to exit
      if(_pc == this.state.instructions.length || _pc == -1){
        if(!errorFlag){
          this._update_status("Finished");
        }
        break;
      }
    }
    //update stack/pc for ui
    this.setState({
      stack: _stack,
      pc: _pc,
      output: _output
    });
  }

  _update_status(msg) {
    let newClass = "";
    switch(msg) {
      case "Loaded":
        newClass = "label label-info";
        break;
      case "Finished":
        newClass = "label label-success";
        break;
      case "Ready":
        newClass = "label label-primary";
        break;
      default:
        newClass = "label label-danger";
    }
    this.setState({
      status: msg,
      statusClass: newClass
    });
  }
}
