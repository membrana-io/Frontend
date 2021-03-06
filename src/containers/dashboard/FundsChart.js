import memoizeOne from 'memoize-one';
import React from 'react';
import 'amcharts3/amcharts/amcharts';
import 'amcharts3/amcharts/xy';
import 'amcharts3/amcharts/pie';
import 'amcharts3/amcharts/serial';
import AmChartsReact from '@amcharts/amcharts3-react';
import { FormattedMessage } from 'react-intl';

class FundsChart extends React.Component {
  state = { data: [] }

  getValueInBTC(currencyName, currencyValue) {
    if (currencyName === 'BTC') {
      return currencyValue;
    }
    if (!this.props.exchangesInfo.exchanges) {
      return 0;
    }
    let rate;
    for (const ex of (this.props.exchangesInfo.exchanges || [])) {
      let marketName = `BTC-${currencyName}`;
      const rates = (this.props.exchangesInfo[ex] && this.props.exchangesInfo[ex].rates) || {};
      rate = rates[marketName] || 0;
      if (rate) {
        return parseFloat((currencyValue * rate).toFixed(8));
      } else {
        marketName = `${currencyName}-BTC`;
        rate = rates[marketName] || 0;
        if (!rate) {
          continue;
        } else {
          return parseFloat((currencyValue / rate).toFixed(8));
        }
      }
    }

    return 0;
  }

  formatData(apiKeys) {
    let data = {};
    for (let apiKey of apiKeys) {
      Array.isArray(apiKey.balances) && apiKey.balances.forEach(currency => {
        if (currency.available === 0){
          return;
        }
        if (!data[currency.name]) {
          data[currency.name] = currency.available;
        } else {
          data[currency.name] += currency.available;
        }
      });
    }
    const formated = Object.keys(data).map(key=>({
      category: key,
      'column-1': data[key],
      'column-2': this.getValueInBTC(key, data[key]),
    })).sort((a1, a2) => a1['column-1'] < a2['column-1']);

    return formated;
  }

  getConfig = memoizeOne((exchangesInfo, apiKeys, contracts) => {
    const funds = apiKeys.concat(contracts.filter(c => c.to._id === this.props.userId));
    const data = this.formatData(funds);
    return {
      'type': 'pie',
      'fontFamily': 'maven_probold',
      'letterSpacing': '1px',
      'hideCredits': true,
      'colors': [
        '#6c6c6e',
        '#dcb049',
        '#c94546',
        '#ce802c',
        '#c5c5c5',
        '#465666',
      ],
      'balloonText': '[[title]]<br><span style=\'font-size:14px\'><b>[[description]]</b> ([[percents]]%)</span>',
      'innerRadius': '70%',
      'labelsEnabled': false,
      'startDuration': 0,
      'titleField': 'category',
      'valueField': 'column-2',
      'allLabels': [],
      'balloon': {},
      'descriptionField': 'column-1',
      'legend': {
        'enabled': true,
        'marginLeft': 0,
        'fontSize': 12,
        'markerSize': 0,
        'switchable': false,
        'equalWidths': false,
        'maxColumns': 1,
        'textClickEnabled': true,
        'divId': 'funds_legend',
        'rollOverColor': '#FFFFFF',
        'labelText': '',
        'valueAlign': 'left',
        'align': 'left',
        'valueText': '[[description]] [[title]]',
        'useMarkerColorForLabels': true,
        'useMarkerColorForValues': true,
      },
      'titles': [],
      'dataProvider': data,
    };
  });



  render() {
    return (
      <div className="table">
        <div className="table_title_wrapper clearfix">
          <div className="table_title center">
            <FormattedMessage
              id="dashboard.availableAssets"
              defaultMessage="AVAILABLE ASSETS"
            />
          </div>
        </div>
        <div className="charts">
          <div className="chart_pie">
            <AmChartsReact.React
              style={{ height: '100%', width: '100%', backgroundColor: 'transparent',position: 'absolute' }}
              options={this.getConfig(this.props.exchangesInfo, this.props.apiKeys, this.props.contracts)}
            />
          </div>
          <div className="legend_pie_wrapper">
            <div id="funds_legend" className="legend_pie">
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default FundsChart;
