import React from "react";

export default class Interpreter extends React.Component {
  static propTypes = {};
  static defaultProps = {};

  constructor(props) {
      super(props);
      this.state = {
        defaultCode: decodeURIComponent(document.location.search.substring(1, document.location.search.length)),
        instructions: [],
        labels: new Map(),
        stack: [],
        pc: 0,
        output: "",
        varStore: new Map(),
        history: [],
        status: "Ready",
        statusClass: "label label-primary",
        volatile: true,
        programModified: false
      };
      this._load = this._load.bind(this);
      this._runFull = this._runFull.bind(this);
      this._runNextStep = this._runNextStep.bind(this);
      this._previousStep = this._previousStep.bind(this);
      this._setVolatile = this._setVolatile.bind(this);
      this._setModified = this._setModified.bind(this);
      this._reset = this._reset.bind(this);

  }

  render() {
    return (
      <div>
      <div className="row">
        <div className="col-md-8 main">
          <textarea className="editor"
                    rows="12"
                    defaultValue={this.state.defaultCode}
                    onChange={this._setModified}
                    ref="sourceCode"
          ></textarea>
          <div className="buttons">
          <button className="btn btn-info btn-load" onClick={this._load}>Load Program {this.state.programModified ? "✎" : ""}</button>
          <button className="btn btn-danger" onClick={this._reset}>Reset</button>
          <button className="btn btn-warning" onClick={this._previousStep} disabled={this.state.volatile}>←Step</button>
          <button className="btn btn-warning" onClick={this._runNextStep} disabled={this.state.volatile}>Step→</button>
          <button className="btn btn-success" onClick={this._runFull} disabled={this.state.volatile}>Continue</button>
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
          <td><code>INT n</code></td>
          <td>Pushes integer <code>n</code> to stack</td>
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
          <td><code>EQUALS</code></td>
          <td>Pops the top two elements and pushes <strong>1</strong> if they are equal, <strong>0</strong> otherwise</td>
          </tr>
          <tr>
          <td><code>LESS_THAN</code></td>
          <td>Pops the top two elements <code>x</code>, <code>y</code> and pushes <strong>1</strong> if <code>y &lt; x</code>, <strong>0</strong> otherwise</td>
          </tr>
          <tr>
          <td><code>GREATER_THAN</code></td>
          <td>Pops the top two elements <code>x</code>, <code>y</code> and pushes <strong>1</strong> if <code>y &gt; x</code>, <strong>0</strong> otherwise</td>
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
          <td><code>VAR_SET x</code></td>
          <td>Sets the variable <code>x</code> to the (popped) top of the stack</td>
          </tr>
          <tr>
          <td><code>VAR_LOOKUP y</code></td>
          <td>Looks up the variable <code>y</code> and pushes it to the stack</td>
          </tr>
          <tr>
          <td><code>JGE l</code></td>
          <td>If top element is <code>&gt;=0</code>, jump to <code>l</code> (can be a line number or label)</td>
          </tr>
          <tr>
          <td><code>JEQ l</code></td>
          <td>If top element is <code>==0</code>, jump to <code>l</code> (can be a line number or label)</td>
          </tr>
          <tr>
          <td><code>JMP l</code></td>
          <td>Jump to <code>l</code> (can be a line number or label)</td>
          </tr>
          <tr>
          <td><code>CALL l</code></td>
          <td>Push <code>pc+1</code> to stack, jump to <code>l</code> (can be a line number or label)</td>
          </tr>
          <tr>
          <td><code>RET</code></td>
          <td>Pop top element, jump to it</td>
          </tr>
          </tbody>
          </table>
          <strong>Labels</strong> can be prepended to lines, e.g. <code>L1: PRINT</code> (the space between the colon and command is important).
        </div>
        <div className="col-md-4 side">
          <p className={this.state.statusClass}>{this.state.status}</p>
          <h4>Output:</h4>
          <pre className="monospace">{this.state.output}</pre>
          <h5>PC:</h5>
          <pre className="monospace">{this.state.pc}</pre>
          <h5>Stack:</h5>
          <pre className="monospace">{JSON.stringify(this.state.stack)}</pre>
          <h5>Loaded instructions:</h5>
          <pre className="monospace">{JSON.stringify(this.state.instructions)}</pre>
          <hr />
          <div className="footer">
            <small>Created by Sam White</small>
          </div>
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
      pc: 0,
      varStore: new Map(),
      history: []
    });
    let volatileFlag = this.state.volatileFlag;
    let errorFlag = false;
    let srctext = this.refs.sourceCode.value.toUpperCase();
    let lines = srctext.match(/[^\r\n]+/g);
    let inst = [];
    let lbls = new Map();
    let vars = new Map();

    for(let i = 0; i < lines.length; i++){
      lines[i] = lines[i].trim();
      if(lines[i].length == 0){
        continue;
      }
      // check for label
      if(lines[i].indexOf(":") > -1){
        let lbl = lines[i].substring(0, lines[i].indexOf(":"));
        lbls.set(lbl, i);
        //strip label
        lines[i] = lines[i].substring(lines[i].indexOf(":") + 2, lines[i].length);
      }
      let split = lines[i].split(" ");
      //add empty param if needed
      if(typeof split[1] === 'undefined'){
        split.push("");
      }
      if(!isNaN(parseInt(split[1]))){
        split[1] = parseInt(split[1]) //convert string to int (unless label)
      }
      inst.push(split);
      //error check (>1 parameter)
      if(split.length > 2){
        errorFlag = true;
        volatileFlag = true;
        this._updateStatus("Syntax Error: too many arguments on line " + (i+1));
        inst = [];
        break;
      }
    };

    if(!errorFlag){
      this._updateStatus("Loaded");
      volatileFlag = false;
    }
    this.setState({
      instructions: inst,
      labels: lbls,
      varStore: vars,
      history: [],
      volatile: volatileFlag,
      programModified: false
    });
  }

  _runFull() {
    let _stack = [];
    let _pc = 0;
    let errorFlag = false;
    let _output = "";
    let _varStore = new Map();

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
        case "EQUALS":
          // EQUALS: push (lhs == rhs), pop rhs first then pop lhs
          //         1 for true, 0 for false
          let eq_rhs = _stack.pop();
          let eq_lhs = _stack.pop();
          if(eq_lhs == eq_rhs){
            _stack.push(1);
          } else {
            _stack.push(0);
          }
          _pc++;
          break;
        case "LESS_THAN":
          // LESS_THAN: push (lhs < rhs), pop rhs first then pop lhs
          //         1 for true, 0 for false
          let lt_rhs = _stack.pop();
          let lt_lhs = _stack.pop();
          if(lt_lhs < lt_rhs){
            _stack.push(1);
          } else {
            _stack.push(0);
          }
          _pc++;
          break;
        case "GREATER_THAN":
          // GREATER_THAN: push (lhs > rhs), pop rhs first then pop lhs
          //         1 for true, 0 for false
          let gt_rhs = _stack.pop();
          let gt_lhs = _stack.pop();
          if(gt_lhs > gt_rhs){
            _stack.push(1);
          } else {
            _stack.push(0);
          }
          _pc++;
          break;
        case "JGE":
          // JGE X: if peek is >= 0, jump to X, else continue
          // X may be a label or line number
          if(_stack[_stack.length - 1] >= 0){
            // check if line number or label
            if(typeof param === "number"){
              _pc = param;
            } else {
              _pc = this.state.labels.get(param);
            }
          } else {
            _pc++;
          }
          break;
        case "JEQ":
          // JEQ X: if peek is == 0, jump to X, else continue
          // X may be a label or line number
          if(_stack[_stack.length - 1] == 0){
            // check if line number or label
            if(typeof param === "number"){
              _pc = param;
            } else {
              _pc = this.state.labels.get(param);
            }
          } else {
            _pc++;
          }
          break;
        case "JMP":
          // JMP L: jump to line L or label L
          if(typeof param === "number"){
            _pc = param;
          } else {
            _pc = this.state.labels.get(param);
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
          // CALL L: push pc+1 to stack, jump to L (may be line or number)
          _stack.push(_pc + 1);
          if(typeof param === "number"){
            _pc = param;
          } else {
            _pc = this.state.labels.get(param);
          }
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
        case "VAR_SET":
          // VAR_SET x: sets the variable x to the (popped) top of the stack.
          _varStore.set(param, _stack.pop());
          _pc++;
          break;
        case "VAR_LOOKUP":
          // VAR_LOOKUP x: lookup x and push to the stack
          _stack.push(_varStore.get(param));
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
          this._setVolatile();
          this._updateStatus("Finished");
        }
        break;
      }
    }
    //update stack/pc for ui
    this.setState({
      stack: _stack,
      pc: _pc,
      output: _output,
      varStore: _varStore
    });
  }

  _runNextStep() {
    let _stack = this.state.stack;
    let _pc = this.state.pc;
    let errorFlag = false;
    let _output = this.state.output;
    let _history = this.state.history;
    let _varStore = this.state.varStore;

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
      case "EQUALS":
        // EQUALS: push (lhs == rhs), pop rhs first then pop lhs
        //         1 for true, 0 for false
        let eq_rhs = _stack.pop();
        let eq_lhs = _stack.pop();
        if(eq_lhs == eq_rhs){
          _stack.push(1);
        } else {
          _stack.push(0);
        }
        _pc++;
        break;
      case "LESS_THAN":
        // LESS_THAN: push (lhs < rhs), pop rhs first then pop lhs
        //         1 for true, 0 for false
        let lt_rhs = _stack.pop();
        let lt_lhs = _stack.pop();
        if(lt_lhs < lt_rhs){
          _stack.push(1);
        } else {
          _stack.push(0);
        }
        _pc++;
        break;
      case "GREATER_THAN":
        // GREATER_THAN: push (lhs > rhs), pop rhs first then pop lhs
        //         1 for true, 0 for false
        let gt_rhs = _stack.pop();
        let gt_lhs = _stack.pop();
        if(gt_lhs > gt_rhs){
          _stack.push(1);
        } else {
          _stack.push(0);
        }
        _pc++;
        break;
      case "JGE":
        // JGE X: if peek is >= 0, jump to X, else continue
        // X may be a label or line number
        if(_stack[_stack.length - 1] >= 0){
          // check if line number or label
          if(typeof param === "number"){
            _pc = param;
          } else {
            _pc = this.state.labels.get(param);
          }
        } else {
          _pc++;
        }
        break;
      case "JEQ":
        // JEQ X: if peek is == 0, jump to X, else continue
        // X may be a label or line number
        if(_stack[_stack.length - 1] == 0){
          // check if line number or label
          if(typeof param === "number"){
            _pc = param;
          } else {
            _pc = this.state.labels.get(param);
          }
        } else {
          _pc++;
        }
        break;
      case "JMP":
        // JMP L: jump to line L or label L
        if(typeof param === "number"){
          _pc = param;
        } else {
          _pc = this.state.labels.get(param);
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
        // CALL L: push pc+1 to stack, jump to L (may be line or number)
        _stack.push(_pc + 1);
        if(typeof param === "number"){
          _pc = param;
        } else {
          _pc = this.state.labels.get(param);
        }
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
      case "VAR_SET":
        // VAR_SET x: sets the variable x to the (popped) top of the stack.
        _varStore.set(param, _stack.pop());
        _pc++;
        break;
      case "VAR_LOOKUP":
        // VAR_LOOKUP x: lookup x and push to the stack
        _stack.push(_varStore.get(param));
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
        this._setVolatile();
        this._updateStatus("Finished");
      }
    } else {
      //update history
      let thisState = {
        stack: eval("("+JSON.stringify(_stack)+")"), // trick to clone new object
        varStore: _varStore,
        pc: _pc,
        output: _output
      };
      Object.freeze(thisState);
      _history.push(thisState);
      this._updateStatus("Executed " + instruction + "(" + param + ").");
    }
    //update stack/pc for ui
    this.setState({
      stack: _stack,
      pc: _pc,
      output: _output,
      history: _history,
      varStore: _varStore
    });
  }

  _previousStep() {
    if(this.state.history.length == 0){
      this._updateStatus("Cannot step back further");
      return;
    }
    let newHistory = this.state.history;
    let newState = this.state.history.pop();
    this.setState({
      stack: newState["stack"],
      pc: newState["pc"],
      output: newState["output"],
      history: newHistory
    });
    this._updateStatus("Stepped back");
  }

  _setVolatile() {
    this.setState({
      volatile: true
    });
    this._updateStatus("Ready");
  }

  _setModified() {
    this.setState({
      programModified: true
    });
  }

  _reset() {
    this.setState({
      stack: [],
      pc: 0,
      output: "",
      varStore: new Map(),
      history: [],
      volatile: false
    })
    this._updateStatus("Loaded");
  }

  _updateStatus(msg) {
    let newClass = "";
    switch(msg.substring(0, 5)) {
      case "Loade":
        newClass = "label label-info";
        break;
      case "Finis":
        newClass = "label label-success";
        break;
      case "Ready":
        newClass = "label label-primary";
        break;
      case "Execu":
        newClass = "label label-warning";
        break;
      case "Stepp":
        newClass = "label label-warning";
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
