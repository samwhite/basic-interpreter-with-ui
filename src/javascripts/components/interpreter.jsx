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
          volatile: true
      };
      this._load = this._load.bind(this);
      this._run = this._run.bind(this);
      this._setVolatile = this._setVolatile.bind(this);

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
                    onChange={this._setVolatile}
                    ref="sourceCode"
          ></textarea>
          <div className="buttons">
          <button className="btn btn-info" onClick={this._load}>Load</button>
          <button className="btn btn-warning" onClick={this._run} disabled={this.state.volatile}>Run</button>
          </div>
          <h5>Commands</h5>
          <table>
          <thead>
          <tr>
          <th>Name</th>
          <th>Description</th>
          </tr>
          </thead>
          <tbody>
          <tr>
          <td><code>PRINT</code></td>
          <td>Prints the top element</td>
          </tr>
          <tr>
          <td><code>INT x</code></td>
          <td>Pushes integer <code>x</code> to stack</td>
          </tr>
          <tr>
          <td><code>ADD</code></td>
          <td>Adds the top two elements</td>
          </tr>
          <tr>
          <td><code>SUB</code></td>
          <td>Subtracts the top two elements</td>
          </tr>
          <tr>
          <td><code>SWAP</code></td>
          <td>Swaps the two top elements</td>
          </tr>
          <tr>
          <td><code>DUP</code></td>
          <td>Duplicates top element</td>
          </tr>
          <tr>
          <td><code>POP</code></td>
          <td>Pops top element from stack (effectively just removes it)</td>
          </tr>
          <tr>
          <td><code>JGE x</code></td>
          <td>If top element is <code>&gt;=0</code>, jump to <code>x</code></td>
          </tr>
          <tr>
          <td><code>JEQ x</code></td>
          <td>If top element is <code>==0</code>, jump to <code>x</code></td>
          </tr>
          <tr>
          <td><code>CALL x</code></td>
          <td>Push <code>pc+1</code> to stack, jump to <code>x</code></td>
          </tr>
          <tr>
          <td><code>RET</code></td>
          <td>Pop top element, jump to it</td>
          </tr>
          </tbody>
          </table>
        </div>
        <div className="col-md-4 side">
          <span className={this.state.statusClass}>{this.state.status}</span>
          <h5>PC:</h5>
          <span className="monospace">{this.state.pc}</span>
          <h5>Stack:</h5>
          <p className="monospace">{JSON.stringify(this.state.stack)}</p>
          <h5>Loaded instructions:</h5>
          <p className="monospace">{JSON.stringify(this.state.instructions)}</p>
          <h5>Output:</h5>
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
    let volatileFlag = this.state.volatileFlag;
    let errorFlag = false;
    let srctext = this.refs.sourceCode.value.toUpperCase();
    let lines = srctext.match(/[^\r\n]+/g);
    let inst = [];

    for(let i = 0; i < lines.length; i++){
      lines[i] = lines[i].trim();
      let split = lines[i].split(" ");
      //add empty param if needed
      if(typeof split[1] === 'undefined'){
        split.push("");
      }
      split[1] = parseInt(split[1]) //convert string to int
      inst.push(split);
      //error check (>1 parameter)
      if(split.length > 2){
        errorFlag = true;
        volatileFlag = true;
        this._updateStatus("Syntax Error: too many arguments on line " + (i+1));
        inst = [];
        break;
      }
      //extra error check (>0 params for 0 param calls)
      if(split[0] == "PRINT" ||
         split[0] == "ADD" ||
         split[0] == "SUB" ||
         split[0] == "SWAP" ||
         split[0] == "DUP" ||
         split[0] == "POP" ||
         split[0] == "RET"
       ) {
         if(!isNaN(split[1])) {
           errorFlag = true;
           volatileFlag = true;
           this._updateStatus("Syntax Error: unexpected argument on line " + (i+1));
           inst = [];
           break;
         }
       }
    };

    if(!errorFlag){
      this._updateStatus("Loaded");
      volatileFlag = false;
    }
    this.setState({
      instructions: inst,
      volatile: volatileFlag
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
          // INT 4: push 4 to stack
          _stack.push(param);
          _pc++;
          break;
        case "ADD":
          // ADD: pop top two, add, push
          let add_op1 = _stack.pop();
          let add_op2 = _stack.pop();
          _stack.push(add_op1 + add_op2);
          _pc++;
          break;
        case "SUB":
          // SUB: pop top two, sub, push
          let sub_op1 = _stack.pop();
          let sub_op2 = _stack.pop();
          _stack.push(sub_op2 - sub_op1);
          _pc++;
          break;
        case "JGE":
          // JGE X: if peek is >= 0, jump to X, else continue
          if(_stack[_stack.length - 1] >= 0){
            _pc = param;
          } else {
            _pc++;
          }
          break;
        case "JEQ":
          // JEQ X: if peek is == 0, jump to X, else continue
          if(_stack[_stack.length - 1] == 0){
            _pc = param;
          } else {
            _pc++;
          }
          break;
        case "SWAP":
          // SWAP: swap top two elements
          let swap_op1 = _stack.pop();
          let swap_op2 = _stack.pop();
          _stack.push(swap_op1);
          _stack.push(swap_op2);
          _pc++;
          break;
        case "CALL":
          // CALL X: push pc+1 to stack, jump to X
          _stack.push(_pc + 1);
          _pc = param;
          break;
        case "RET":
          // RET: set pc to pop
          _pc = _stack.pop();
          break;
        case "DUP":
          // DUP: duplicate top of stack
          _stack.push(_stack[_stack.length - 1]);
          _pc++;
          break;
        case "POP":
          // POP: pops (removes) top element
          _stack.pop();
          _pc++;
          break;
        case "EXIT":
          // EXIT: terminates program (by setting pc to -1)
          _pc = -1;
          break;
        case "PRINT":
          // PRINT: peek and print
          _output = _output.concat(_stack[_stack.length - 1]).concat("\n");
          _pc++;
          break;
        default:
          errorFlag = true;
          this._updateStatus("Unknown instruction `" + instruction + "`");
          _pc = -1;
      }
      // check if we need to exit
      if(_pc == this.state.instructions.length || _pc == -1){
        if(!errorFlag){
          this._updateStatus("Finished");
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

  _setVolatile() {
    this.setState({
      volatile: true
    });
  }

  _updateStatus(msg) {
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
