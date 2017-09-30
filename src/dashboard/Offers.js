import React from 'react';
import { Link } from 'react-router-dom';
import SegmentedControl from '../generic/SegmentedControl';
import ReactTable from '../generic/SelectableReactTable';
import './Offers.css';

class Offers extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedTab: 0
    };
    this.onTabChange = this.onTabChange.bind(this);
    this.onOfferPayClick = this.onOfferPayClick.bind(this);
  }

  onOfferPayClick(offer) {
    console.log('clicked paying offer');
  }

  componentWillReceiveProps(nextProps) {
    if(!nextProps.selectedOffer) {
      return;
    }
    if(this.props.offers.incoming.find(o => o._id === nextProps.selectedOffer._id)
      && this.state.selectedTab !== 0) {

      this.setState({selectedTab: 0});
    } else if(this.props.offers.outgoing.find(o => o._id === nextProps.selectedOffer._id) &&
      this.state.selectedTab !== 1) {
      this.setState({selectedTab: 1});
    }
  }


  onTabChange(index) {
    this.setState({selectedTab: index});
  }

  render() {
    const segments = ['INBOX', 'OUTBOX'];
    return (
      <div className="requests_table table">
        <div className="table_title_wrapper clearfix">
          <div className="table_title">Request list</div>
          <SegmentedControl selectedIndex={this.state.selectedTab}
            onChange={this.onTabChange}
            segments={segments}
          />
        </div>
        {this.renderContent()}
        {this.renderForm()}
      </div>
    );
  }

  renderForm() {
    if(this.props.selectedOffer) {
      if(this.state.selectedTab === 0) {
        const onAcceptClick = e => {
          e.preventDefault();
          this.props.onOfferAccepted(this.props.selectedOffer);
        };
        const onRejectClick = e => {
          e.preventDefault();
          this.props.onOfferRejected(this.props.selectedOffer);
        };
        return (
          <div className="table_requests_control_wr clearfix">
            <div className="table_requests_control_text">Do you want to accept this request?</div>
            <div className="table_requests_control_btns">
              <a onClick={onAcceptClick}
                className="table_requests_yes table_requests_btn" href="">Yes</a>
              <a onClick={onRejectClick}
                className="table_requests_no table_requests_btn" href="">No</a>
            </div>
          </div>
        );
      } else {
        const onClick = e => {
          e.preventDefault();
          this.props.onOfferCanceled(this.props.selectedOffer);
        };
        return (
          <div className="table_requests_control_wr clearfix">
            <div className="table_requests_control_text">Cancel this request?</div>
            <div className="table_requests_control_btns">
              <a
                onClick={onClick}
                className="table_requests_yes table_requests_btn" href="">Yes</a>
            </div>
          </div>
        );
      }
    }
  }


  renderContent() {
    const columns = [{
      Header: 'From',
      accessor: 'from',
      className: 'table_col_value'
    }, {
      id: '_id',
      Header: 'Time',
      className: 'table_col_value',
      accessor: offer => {
        const date = new Date(offer.date);
        const current = Date.now();
        return current - date.getTime();
      },
      Cell: OfferCell(this.onOfferPayClick)
    }, {
      Header: 'Sum',
      className: 'table_col_value',
      accessor: 'amount'
    }];
    const data = this.state.selectedTab ? this.props.offers.outgoing : this.props.offers.incoming;
    const style={height: 352};
    return (
      <ReactTable
        style={style}
        data={data}
        columns={columns}
        selectedItem={this.props.selectedOffer}
        onItemSelected={this.props.onOfferSelected}
      />
    );
  }

}

const OfferCell = (onPayClick) => {
  return rowInfo => {
    if(rowInfo.original.state === 'ACCEPTED') {
      const onClick = e => {
        e.stopPropagation();
        onPayClick(rowInfo.original);
      };
      const style ={width: '60%', background: '#ffad39'};
      return (
        <div onClick={onClick}
          className="pay_request_wrapper">
          <span className="pay_request_btn_txt">pay</span>
          <div className="request_progress_wr">
            <div className="hours_scale" style={style}></div>
          </div>
        </div>
      );
    } else {
      const value = rowInfo.value;
      const style = {};
      let ratio = Math.abs(1 - value / 86400000) * 100;
      ratio = ratio > 100 ? 100 : ratio;
      if(ratio > 66) {
        style.background = '#52e069';
      } else if(ratio > 33) {
        style.background = '#ffad39';
      } else {
        style.background = '#c94546';
      }
      style.width = ratio + '%';
      const wrStyle = {height: 'auto'};
      return (
        <div style={wrStyle}>{formatTime(rowInfo.value)}
          <div className="request_progress_wr">
            <div className="request_progress" style={style}></div>
          </div>
        </div>
      );
    }
  };
};



export default Offers;


function formatTime(difference){
  const hours = Math.floor(difference / 1000 / 3600);
  const minutes = Math.floor(difference / 1000 % 3600 / 60);
  return `${hours} h ${minutes} m`;
}
