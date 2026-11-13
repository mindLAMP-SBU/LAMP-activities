import * as React from "react";
import { Button, Modal } from "react-bootstrap";
import i18n from "../i18n";
import RotatePhone from "../icons/RotatePhone";

interface Props {
  show: boolean;
  modalClose(status: boolean): void;
  language: string;
}

interface State {
  showStatus: boolean;
  page: number;
}

export class InstructionModal extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { showStatus: this.props.show, page: 0 };
  }

  handleClose = () => {
    this.setState({ showStatus: false });
    this.props.modalClose(false);
  };

  handleNext = () => {
    this.setState({ page: 1})
  }

  render() {
    return (
      <Modal
        show={this.state.showStatus}
        onHide={this.handleClose}
        animation={false}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered={true}
      >
        <Modal.Header className="instruction-modal-header">
          <Modal.Title className="instruction-modal-title">
            {i18n.t("Instructions")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="instruction-modal-body">
          {
            this.state.page == 0 ?
              (
                <>
                  <div className="instruction-graphic"><RotatePhone /></div>
                  {i18n.t("INSTRUCTIONS")}
                </>
              ) :
              i18n.t("INSTRUCTIONS_2")
          }
        </Modal.Body>
        <Modal.Footer className="instruction-modal-footer">
          {
            this.state.page == 0 ?
              (
                <Button className="instruction-modal-btn" onClick={this.handleNext}>
                  {i18n.t("Next")}
                </Button>
              ) :
              (
                <Button className="instruction-modal-btn" onClick={this.handleClose}>
                  {i18n.t("Start")}
                </Button>
              )
          }
          
        </Modal.Footer>
      </Modal>
    );
  }
}
