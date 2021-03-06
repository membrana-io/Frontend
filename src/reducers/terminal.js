import {
  SELECT_FUND, SELECT_EXCHANGE, SELECT_MARKET, SELECT_INTERVAL, CHECK_URL_VALIDITY,
  GET_MY_ORDERS, GET_GROUP_ORDER, CANCEL_ORDER, PLACE_ORDER, UPDATE_ORDER,
  UPDATE_ORDER_BOOK, UPDATE_HISTORY, UPDATE_TICKER, SELECT_ASSET_GROUP,
} from '../actions/terminal';
import { UPDATE_ASSET_GROUP, DELETE_ASSET_GROUP } from '../actions/assetGroup';

export default function(state = {
  fund: null,
  assetGroup: null,
  exchange: 'binance',
  market: 'USDT-BTC',
  interval: '30 MIN',
  orderBook: {sell: [], buy: [], smap: {}, bmap: {}},
  history: [],
  ticker: {},
  orders: {open: [], closed: []},
  isValidUrl: undefined,
}, action) {
  switch(action.type) {
    case SELECT_FUND: {
      if (action.fund) {
        window.localStorage.setItem('lastSelectedFund', action.fund._id);
      }
      const orders = (state.fund && action.fund && state.fund._id === action.fund._id) ? state.orders : {open: [], closed: []};
      return {...state, fund: action.fund,
        orders,
      };
    }
    case SELECT_MARKET: {
      if(action.market === state.market) {
        return state;
      } else {
        return {...state, market: action.market, orderBook: {sell: [], buy: [], smap: {}, bmap: {}}, history: [], ticker: null};
      }
    }
    case SELECT_ASSET_GROUP: {
      if (action.group) {
        window.localStorage.setItem('lastSelectedFund', action.group._id);
      }
      return {
        ...state,
        assetGroup: action.group,
        orders: {open: [], closed: []},
        fund: null,
      };
    }
    case DELETE_ASSET_GROUP: {
      return {
        ...state,
        assetGroup: null,
        orders: state.assetGroup ? { open: [], closed: [] } : state.orders,
      };
    }
    case UPDATE_ASSET_GROUP: {
      const { assetGroup } = state;

      return { ...state, assetGroup: assetGroup ? action.assetGroup : null };
    }
    case SELECT_EXCHANGE: {
      if(action.exchange === state.exchange) {
        return state;
      } else {
        return {
          ...state,
          exchange: action.exchange,
          orderBook: {sell: [], buy: [], smap: {}, bmap: {}}, history: [],
          orders: {open: [], closed: []},
        };
      }
    }
    case SELECT_INTERVAL: {
      if(action.interval === state.interval) {
        return state;
      } else {
        return {...state, interval: action.interval};
      }
    }
    case UPDATE_ORDER_BOOK: {
      if(!(action.market === state.market && action.exchange === state.exchange)) {
        return state;
      }
      let orderBook = {...state.orderBook};
      if (action.isFull) {
        orderBook = {sell: [], buy: [], smap: {}, bmap: {}};
      }
      if (action.orderBook.sell.length) {
        const smap = {...orderBook.smap};
        for(const o of action.orderBook.sell) {
          const [value, amount] = o;
          if(amount === 0) {
            delete smap[value];
          } else {
            smap[value] = {Quantity: amount, Rate: value};
          }
        }
        const sell = Object.values(smap).sort((o1, o2) => o1.Rate - o2.Rate);
        const maxSell = sell.reduce((accum, value) => Math.max(accum, value.Quantity * value.Rate), 0);
        const minSell = sell.reduce((accum, value) => Math.min(accum, value.Quantity * value.Rate), maxSell);
        orderBook.smap = smap;
        orderBook.sell = sell;
        orderBook.maxSell = maxSell;
        orderBook.minSell = minSell;
      }
      if (action.orderBook.buy.length) {
        const bmap = {...orderBook.bmap};
        for(const o of action.orderBook.buy) {
          const [value, amount] = o;
          if(amount === 0) {
            delete bmap[value];
          } else {
            bmap[value] = {Quantity: amount, Rate: value};
          }
        }
        const buy = Object.values(bmap).sort((o1, o2) => o2.Rate - o1.Rate);
        const maxBuy = buy.reduce((accum, value) => Math.max(accum, value.Quantity * value.Rate), 0);
        const minBuy = buy.reduce((accum, value) => Math.min(accum, value.Quantity * value.Rate), maxBuy);
        orderBook.bmap = bmap;
        orderBook.buy = buy;
        orderBook.maxBuy = maxBuy;
        orderBook.minBuy = minBuy;
      }
      return {...state, orderBook };
    }
    case UPDATE_HISTORY: {
      if((action.market !== state.market && action.exchange !== state.exchange)) {
        return state;
      }

      const history = action.history
        .sort((t1, t2) => t2[2] - t1[2])
        .map(t => ({
          id: Math.random().toFixed(8),
          price: t[0],
          amount: t[1],
          type: t[3],
          dt: t[2],
        }));

      return {...state, history: history.concat(state.history).slice(0, 50)};
    }
    case UPDATE_TICKER: {
      if(action.exchange === state.exchange && action.market === state.market) {
        return {...state, ticker: action.ticker};
      }
      return state;
    }
    case GET_MY_ORDERS: {
      const fund = state.fund || state.assetGroup;
      if(fund && fund._id === action.fundId) {
        return {...state, orders: action.orders};
      }
      break;
    }

    case GET_GROUP_ORDER: {
      const { open, closed } = state.orders;
      const order = open.find(order => order._id === action.order._id);

      if (order) {
        return {
          ...state,
          orders: {
            open: open.map(item => item._id === order._id ? action.order : item),
            closed,
          },
        };
      } else {
        return {
          ...state,
          orders: {
            open,
            closed: closed.map(item => item._id === action.order._id ? action.order : item),
          },
        };
      }
    }

    case PLACE_ORDER: {
      const order = state.orders.open.find(o => o._id === action.order._id);
      if(!order) {
        let closed = state.orders.closed;
        let opened = state.orders.open;
        if (action.order.state === 'CLOSED') {
          closed = [action.order, ...closed];
        } else {
          opened = [action.order, ...opened];
        }
        const orders = {
          open: opened,
          closed: closed,
        };
        return {...state, orders};
      } else {
        return state;
      }
    }
    case UPDATE_ORDER: {
      if (!(state.fund && state.fund._id === action.fundId)) {
        return state;
      }
      let { open, closed } = state.orders;
      const order = action.order;
      switch (order.state) {
        case 'OPEN': {
          const old = open.find((o) => o._id === order._id);
          if (old) {
            open = open.map((o) => o._id === order._id ? order : o);
          } else {
            open = [order, ...open];
          }
          break;
        }
        case 'CLOSED': {
          const old = closed.find((o) => o._id === order._id);
          const oldOpen = open.find((o) => o._id === order._id);
          if (old) {
            closed = closed.map((o) => o._id === order._id ? order: o);
          } else if (!order.isAlgo) {
            closed = [order, ...closed];
          }
          if (oldOpen) {
            open = open.filter((o) => o._id !== order._id);
          }
          break;
        }
        default:
          return state;
      }
      return {...state, orders: { open, closed }};
    }
    case CANCEL_ORDER: {
      const order = state.orders.open.find(o => o._id === action.order._id);
      if(order) {
        const orders = {
          open: state.orders.open.filter(o => o._id !== action.order._id),
          closed: state.orders.closed,
        };
        if(order.filled > 0) {
          orders.closed = [action.order, ...state.orders.closed];
        }
        return {...state, orders};
      }
      break;
    }

    case CHECK_URL_VALIDITY: {
      const { isValidUrl } = action;
      return { ...state, isValidUrl };
    }
    default:
      return state;
  }
  return state;
}
