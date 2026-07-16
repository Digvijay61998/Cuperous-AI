import { Provider } from "react-redux";
import Layout from './page';
import { store } from "./store";
export default function App({}: any) {
  return (
    <Provider store={store}>
        <Layout/>
    </Provider> 
  );
}
