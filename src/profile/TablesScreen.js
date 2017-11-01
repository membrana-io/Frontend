import React from 'react';
import { Col, Row, Container } from 'reactstrap';
import ProfitChart from './ProfitChart';
import Feedback from './Feedback';
import CurrencySettings from './CurrencySettings';
import TradeHistory from './TradeHistory';

class TablesScreen extends React.Component {
  render() {
    return (
      <Col xs="12" sm="12" md className="item-screen table-screen">
        <Container fluid className="h-100">
          <Row className="justify-content-center h-100">
            <Col xs="12" sm="12" md="12" lg="12" xl="12">
              <Container fluid className="h-custom-100">
                <Row className="table-row">
                  <ProfitChart />
                  <Feedback
                    comments={[{name: 'Some', text:'super'}]}
                  />
                </Row>
                <Row className="d-none d-md-block">
                  <Col xs="12" className="gap-card"></Col>
                </Row>
                <Row className="table-row">
                  <CurrencySettings
                    onCurrencyToggle={this.props.onCurrencyToggle}
                    currencies={this.props.currencies}
                  />
                  <TradeHistory />
                </Row>
              </Container>
            </Col>
          </Row>
        </Container>
      </Col>
    );
  }
}

export default TablesScreen;