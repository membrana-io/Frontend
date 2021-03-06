import React from 'react';
import AmChartsReact from '@amcharts/amcharts3-react';
import { Col, Row } from 'reactstrap';
import memoizeOne from 'memoize-one';
import { ProfileBlock, BalanceChartHelpTooltip } from '../../components/ProfileBlock';
import SegmentedControl from '../../components/SegmentedControl';
import { Desktop, Mobile } from '../../generic/MediaQuery';
import classNames from 'classnames';

class BalanceChart extends React.PureComponent {

  static lsKeySelectedGraphs = 'profile.balanceChart.selected'
  static lsKeySelectedInterval = 'profile.balanceChart.selectedInterval'

  constructor(props) {
    super(props);
    let selectedCharts;
    const stored = window.localStorage.getItem(BalanceChart.lsKeySelectedGraphs);
    if (stored) {
      selectedCharts = JSON.parse(stored);
    } else {
      selectedCharts = ['USDT', 'BTC'];
    }
    let selectedInterval = JSON.parse(window.localStorage.getItem(
      BalanceChart.lsKeySelectedInterval
    ));
    if (!selectedInterval && selectedInterval !== 0) {
      selectedInterval = 2;
    }
    this.state = {
      data: [],
      selected: selectedCharts,
      selectedInterval,
      end: Date.now(),
      start: Date.now() - 86400 * 7 * 1000,
      loading: false,
    };
  }

  onZoom = (item) => {
    const {start: selectedStart, end: selectedEnd} = item;
    this.setState({selectedStart, selectedEnd});
  }

  onZoomOut = (item) => {
    this.setState({
      startItem: item.chart.dataProvider[item.startIndex],
      endItem: item.chart.dataProvider[item.endIndex],
    });
  }

  segments = ['ALL', 'MONTH', 'WEEK']

  onSegmentChange = (segment) => {
    let start;
    switch (segment) {
      case 0:
        start = 0;
        break;
      case 1:
        start = Date.now() - 86400 * 1000 * 30;
        break;
      case 2:
        start = Date.now() - 86400 * 1000 * 7;
        break;
      default:
        start = 0;
    }
    window.localStorage.setItem(BalanceChart.lsKeySelectedInterval, segment);
    this.setState({selectedInterval: segment});
    this.fetchData(start, Date.now());
  }

  fetchData(start, end) {
    this.setState({loading: true, start, end, data: []});
    window.fetch(`/api/v2/profile/${this.props.name}/balanceStat?start=${start}&end=${end}`)
      .then(res => res.json())
      .then(data => this.setState({data, loading: false}));
  }

  componentDidUpdate(prevProps) {
    if (this.props.name && this.props.name !== prevProps.name) {
      this.fetchData(this.state.start, this.state.end);
    }
  }

  componentDidMount() {
    if (this.props.name) {
      this.fetchData(this.state.start, this.state.end);
    }
  }

  toggle = (graphId) => {
    let selected;
    if (this.state.selected.includes(graphId)) {
      selected =  this.state.selected.filter((id) => id !== graphId);
    } else {
      selected = [...this.state.selected, graphId];
    }
    selected.sort().reverse();
    window.localStorage.setItem(BalanceChart.lsKeySelectedGraphs,
      JSON.stringify(selected),
    );
    this.setState({selected});
  }

  render() {
    const { selected } = this.state;
    return (
      <ProfileBlock
        iconClassName='icon-005-growth'
        title='profile.balanceChart'
        className='graphic'
        Tooltip={BalanceChartHelpTooltip}
      >
        <Row className="justify-content-center d-flex">
          <Col xs={{size: 12, order: 2}} md="9">
            <div className="amcharts">
              <Preloader show={this.state.loading} />
              {this.renderChart()}
            </div>
          </Col>
          <Col xs={{size: 12, order: 3}} md="3" className='legend'>
            <div className='graphs'>
              <span className={classNames('usdt', {unselected: !selected.includes('USDT')})} onClick={() => this.toggle('USDT')}>USDT</span> / <span
                className={classNames('btc', {unselected: !selected.includes('BTC')})} onClick={() => this.toggle('BTC')}>BTC</span>
            </div>
            {this.renderCurrent()}
            {this.renderChange()}
          </Col>
          <Col xs={{order: 1}} md={{order: 3}}>
            <Desktop>
              <SegmentedControl
                segments={this.segments}
                selectedIndex={this.state.selectedInterval}
                onChange={this.onSegmentChange} />
            </Desktop>
            <Mobile>
              <SegmentedControl
                segments={this.segments}
                segmentWidth={50}
                selectedIndex={this.state.selectedInterval}
                onChange={this.onSegmentChange} />
            </Mobile>
          </Col>
        </Row>
      </ProfileBlock>
    );
  }

  renderChange() {
    const {startItem: first, endItem: latest} = this.state;
    if (!latest) {
      return null;
    } else {
      const btcLast = latest.btc;
      const btcFirst = first.btc;
      const usdtLast = latest.usdt;
      const usdtFirst = first.usdt;
      let btcChange;
      if (btcFirst === 0 && btcLast === 0) {
        btcChange = 0;
      } else if (btcFirst === 0) {
        btcChange = 100;
      } else {
        btcChange = (((btcLast / btcFirst) || 0) - 1) * 100;
      }
      let usdtChange;
      if (usdtFirst === 0 && usdtLast === 0) {
        usdtChange = 0;
      } else if (usdtFirst === 0) {
        usdtChange = 100;
      } else {
        usdtChange = (((usdtLast / usdtFirst) || 0) - 1) * 100;
      }
      const arrayOfElements = this.state.selected.map((u, index) => {
        let className;
        let value;
        if (u === 'USDT') {
          className = 'usdt';
          value = usdtChange.toFixed(2);
        } else {
          className = 'btc';
          value = btcChange.toFixed(2);
        }
        return <span className={className} key={className}>{value}%</span>;
      })
        .reduce((acc, elem, index, array) => {
          acc.push(elem);
          if (index < array.length - 1) {
            acc.push(' / ');
          }
          return acc;
        }, []);
      return (
        <div className='values'>Change: {arrayOfElements}</div>
      );
    }
  }

  renderCurrent() {
    const {endItem} = this.state;
    if (!endItem) {
      return null;
    } else {
      const arrayOfElements = this.state.selected.map((u, index) => {
        let className;
        let value;
        if (u === 'USDT') {
          className = 'usdt';
          value = endItem.usdt.toFixed(2);
        } else {
          className = 'btc';
          value = endItem.btc.toFixed(6);
        }
        return <span className={className} key={className}>{value}</span>;
      })
        .reduce((acc, elem, index, array) => {
          acc.push(elem);
          if (index < array.length - 1) {
            acc.push(' / ');
          }
          return acc;
        }, []);
      return (
        <div className='values'>Current: {arrayOfElements}</div>
      );
    }
  }

  graphBalloon() {
    return '';
  }

  calculateDataProvider(segment) {
  }

  getConfig = memoizeOne((data, selectedInterval, selected) => {
    const minPeriod = '30mm';
    const {
      dataProvider,
      graphs,
    } = this.formatData(data, selectedInterval, selected);
    const config = {
      type: 'serial',
      color: '#6f6f71',
      fontFamily: 'maven_proregular',
      marginRight: 80,
      hideCredits: true,
      dataDateFormat: 'YYYY-MM-DD',
      synchronizeGrid: false,
      'chartCursor': {
        cursorColor: '#c74949',
        showBalloon: true,
        'valueLineBalloonEnabled': true,
        'valueLineEnabled': true,
      },
      'balloon': {
      },
      valueAxes: [
        {
          id: 'usdt',
          title: 'Total balance, USDT',
          position: 'right',
          axisAlpha: 0
        },
        {
          id: 'btc',
          title: 'Total balance, BTC',
          position: 'left',
          axisAlpha: 0
        },
      ],
      graphs,
      listeners: [
        {
          event: 'rendered',
          method: function({type, chart}) {
            chart.zoomOut();
          },
        },
        {
          event: 'zoomed',
          method: this.onZoomOut,
        },
      ],
      categoryField: 'date',
      categoryAxis: {
        minPeriod,

        parseDates: true,
      },
      dataProvider,
      'pathToImages': 'http://cdn.amcharts.com/lib/3/images/',
      'zoomOutText': 'Zoom out',
      'zoomOutButtonAlpha': 0,
      'zoomOutButtonColor': '#fff',
      'zoomOutButtonImage': 'lensWhite',
      'zoomOutButtonRollOverAlpha': 0.1,
    };
    return config;
  })

  formatData = (data, selectedInterval, selected) => {
    const groups = [];

    let activeGroup = 0;
    let i = 0;
    while (i < data.length) {
      const group = {
        btcId: activeGroup + 'btc',
        usdtId: activeGroup + 'usdt',
        data: [],
      };
      for (i; i < data.length; i++) {
        const stat = data[i];
        const usdt = parseFloat(
          (stat.ownBalance.USDT + stat.contractBalance.USDT).toFixed(2),
        );
        const btc = parseFloat(
          (stat.ownBalance.BTC + stat.contractBalance.BTC).toFixed(8),
        );
        if (usdt === 0) {
          if (group.length === 0) {
            continue;
          } else {
            activeGroup++;
            i++;
            break;
          }
        } else {
          group.data.push({
            date: new Date(stat.date),
            [activeGroup + 'usdt']: usdt,
            [activeGroup + 'btc']: btc,
            usdt,
            btc,
          });
        }
      }
      if (group.data.length > 0) {
        groups.push(group);
      }
    }

    const graphs = [];
    groups.forEach((g) => {
      graphs.push({
        lineColor: '#32ba94',
        lineThickness: 2,
        valueAxis: 'btc',
        bullet: 'round',
        bulletSize: 1,
        bulletAlpha: 0,
        hidden: !selected.includes('BTC'),
        id: g.btcId,
        valueField: g.btcId,
      });
      graphs.push({
        lineColor: '#0a87b8',
        lineThickness: 2,
        valueAxis: 'usdt',
        bullet: 'round',
        bulletSize: 1,
        bulletAlpha: 0,
        hidden: !selected.includes('USDT'),
        valueField: g.usdtId,
        id: g.usdtId,
      });
    });
    const points = groups.reduce((a, g) => a.concat(g.data), []);
    return {dataProvider: points, graphs};
  }

  renderChart() {
    const config = this.getConfig(this.state.data, this.state.selectedInterval, this.state.selected);
    return (
      <AmChartsReact.React style={{height: '100%', width: '100%', backgroundColor: 'transparent',position: 'absolute'}}
        options={config} />
    );
  }
}

function Preloader({show}) {
  if (!show) {
    return null;
  } else {
    return (
      <div className='preloader' />
    );
  }
}


export default BalanceChart;
