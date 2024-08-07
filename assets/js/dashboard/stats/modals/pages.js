import React from "react";
import { Link } from 'react-router-dom'
import { withRouter } from 'react-router-dom'

import Modal from './modal'
import * as api from '../../api'
import numberFormatter, { durationFormatter } from '../../util/number-formatter'
import { parseQuery } from '../../query'
import { trimURL, updatedQuery } from '../../util/url'
import { hasGoalFilter, replaceFilterByPrefix } from "../../util/filters";

class PagesModal extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: true,
      query: parseQuery(props.location.search, props.site),
      pages: [],
      page: 1,
      moreResultsAvailable: false
    }
  }

  componentDidMount() {
    this.loadPages();
  }

  loadPages() {
    const detailed = this.showExtra()
    const { query, page } = this.state;

    api.get(`/api/stats/${encodeURIComponent(this.props.site.domain)}/pages`, query, { limit: 100, page, detailed })
      .then((response) => this.setState((state) => ({ loading: false, pages: state.pages.concat(response.results), moreResultsAvailable: response.results.length === 100 })))
  }

  loadMore() {
    this.setState({ loading: true, page: this.state.page + 1 }, this.loadPages.bind(this))
  }

  showExtra() {
    return this.state.query.period !== 'realtime' && !hasGoalFilter(this.state.query)
  }

  showPageviews() {
    return this.state.query.period !== 'realtime' && !hasGoalFilter(this.state.query)
  }

  showConversionRate() {
    return hasGoalFilter(this.state.query)
  }

  formatBounceRate(page) {
    if (typeof (page.bounce_rate) === 'number') {
      return page.bounce_rate + '%'
    } else {
      return '-'
    }
  }

  renderPage(page) {
    const filters = replaceFilterByPrefix(this.state.query, "page", ["is", "page", [page.name]])
    const timeOnPage = page['time_on_page'] ? durationFormatter(page['time_on_page']) : '-';
    return (
      <tr className="text-sm dark:text-gray-200" key={page.name}>
        <td className="p-2">
          <Link
            to={{
              pathname: `/`,
              search: updatedQuery({ filters })
            }}
            className="hover:underline block truncate"
          >
            {trimURL(page.name, 50)}
          </Link>
        </td>
        {this.showConversionRate() && <td className="p-2 w-32 font-medium" align="right">{page.total_visitors}</td>}
        <td className="p-2 w-32 font-medium" align="right">{numberFormatter(page.visitors)}</td>
        {this.showPageviews() && <td className="p-2 w-32 font-medium" align="right">{numberFormatter(page.pageviews)}</td>}
        {this.showExtra() && <td className="p-2 w-32 font-medium" align="right">{this.formatBounceRate(page)}</td>}
        {this.showExtra() && <td className="p-2 w-32 font-medium" align="right">{timeOnPage}</td>}
        {this.showConversionRate() && <td className="p-2 w-32 font-medium" align="right">{page.conversion_rate}%</td>}
      </tr>
    )
  }

  label() {
    if (this.state.query.period === 'realtime') {
      return 'Current visitors'
    }

    if (this.showConversionRate()) {
      return 'Conversions'
    }

    return 'Visitors'
  }

  renderLoading() {
    if (this.state.loading) {
      return <div className="loading my-16 mx-auto"><div></div></div>
    } else if (this.state.moreResultsAvailable) {
      return (
        <div className="w-full text-center my-4">
          <button onClick={this.loadMore.bind(this)} type="button" className="button">
            Load more
          </button>
        </div>
      )
    }
  }

  renderBody() {
    if (this.state.pages) {
      return (
        <React.Fragment>
          <h1 className="text-xl font-bold dark:text-gray-100">Top Pages</h1>

          <div className="my-4 border-b border-gray-300"></div>
          <main className="modal__content">
            <table className="w-max overflow-x-auto md:w-full table-striped table-fixed">
              <thead>
                <tr>
                  <th className="p-2 w-48 md:w-56 lg:w-1/3 text-xs tracking-wide font-bold text-gray-500 dark:text-gray-400" align="left">Page url</th>
                  {this.showConversionRate() && <th className="p-2 w-32 text-xs tracking-wide font-bold text-gray-500 dark:text-gray-400" align="right">Total visitors</th>}
                  <th className="p-2 w-32 text-xs tracking-wide font-bold text-gray-500 dark:text-gray-400" align="right">{this.label()}</th>
                  {this.showPageviews() && <th className="p-2 w-32 text-xs tracking-wide font-bold text-gray-500 dark:text-gray-400" align="right">Pageviews</th>}
                  {this.showExtra() && <th className="p-2 w-32 text-xs tracking-wide font-bold text-gray-500 dark:text-gray-400" align="right">Bounce rate</th>}
                  {this.showExtra() && <th className="p-2 w-32 text-xs tracking-wide font-bold text-gray-500 dark:text-gray-400" align="right">Time on Page</th>}
                  {this.showConversionRate() && <th className="p-2 w-32 text-xs tracking-wide font-bold text-gray-500 dark:text-gray-400" align="right">CR</th>}
                </tr>
              </thead>
              <tbody>
                {this.state.pages.map(this.renderPage.bind(this))}
              </tbody>
            </table>
          </main>
        </React.Fragment>
      )
    }
  }

  render() {
    return (
      <Modal>
        {this.renderBody()}
        {this.renderLoading()}
      </Modal>
    )
  }
}

export default withRouter(PagesModal)
