import React from "react";

export default class Interpreter extends React.Component {
  static propTypes = {};
  static defaultProps = {};

  render() {
    return (
      <div>
      <div className="row">
        <div className="col-md-8 main">
          md-8
        </div>
        <div className="col-md-4 side">
          md-4
        </div>
      </div>
      </div>
    );
  }
}
