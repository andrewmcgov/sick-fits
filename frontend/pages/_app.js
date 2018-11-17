import App, { Container } from "next/app";
import Page from "../components/Page";
import { ApolloProvider } from 'react-apollo';
import withData from '../lib/withData';

// _app.js is used in Next.js to allow custom content that is used on every page, above the router
class MyApp extends App {

  // get initial props is a next js method
  // to get props before server rendering the page
  // Crawls the whole pages for queries and gets the data first
  // Only need to do this because of SSR, check nextjs docs for more info
  static async getInitialProps({ Component, ctx}) {
    let pageProps = {};
    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx);
    }
    // This exposes the query to the user
    pageProps.query = ctx.query;
    return { pageProps };
  }

  render() {
    const { Component, apollo, pageProps } = this.props;

    return (
      <Container>
        <ApolloProvider client={apollo}>
          <Page>
            <Component {... pageProps}/>
          </Page>
        </ApolloProvider>
      </Container>
    );
  }
}

export default withData(MyApp);
