import React from "react";
import { Link, withRouter } from 'react-router-dom'


import Modal from './modal'
import * as api from '../../api'
import numberFormatter, { durationFormatter } from '../../util/number-formatter'
import { parseQuery } from '../../query'
import { trimURL, updatedQuery } from '../../util/url'
import { hasGoalFilter, replaceFilterByPrefix } from "../../util/filters";

class EntryPagesModal extends React.Component {
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
    const { query, page } = this.state;

    api.get(
      `/api/stats/${encodeURIComponent(this.props.site.domain)}/entry-pages`,
      query,
      { limit: 100, page }
    )
      .then(
        (response) => this.setState((state) => ({
          loading: false,
          pages: state.pages.concat(response.results),
          moreResultsAvailable: response.results.length === 100
        }))
      )
  }

  loadMore() {
    const { page } = this.state;
    this.setState({ loading: true, page: page + 1 }, this.loadPages.bind(this))
  }

  formatBounceRate(page) {
    if (typeof (page.bounce_rate) === 'number') {
      return `${page.bounce_rate}%`;
    }
    return '-';
  }

  showConversionRate() {
    return hasGoalFilter(this.state.query)
  }

  showExtra() {
    return this.state.query.period !== 'realtime' && !this.showConversionRate()
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

  renderPage(page) {
    const filters = replaceFilterByPrefix(this.state.query, "entry_page", ["is", "entry_page", [page.name]])
    return (
      <tr className="text-sm dark:text-gray-200" key={page.name}>
        <td className="p-2 truncate">
          <Link
            to={{
              pathname: `/`,
              search: updatedQuery({ filters })
            }}
            className="hover:underline"
          >
            {trimURL(page.name, 40)}
          </Link>
        </td>
        {this.showConversionRate() && <td className="p-2 w-32 font-medium" align="right">{numberFormatter(page.total_visitors)}</td>}
        <td className="p-2 w-32 font-medium" align="right">{numberFormatter(page.visitors)}</td>
        {this.showExtra() && <td className="p-2 w-32 font-medium" align="right">{numberFormatter(page.visits)}</td>}
        {this.showExtra() && <td className="p-2 w-32 font-medium" align="right">{durationFormatter(page.visit_duration)}</td>}
        {this.showConversionRate() && <td className="p-2 w-32 font-medium" align="right">{numberFormatter(page.conversion_rate)}%</td>}
      </tr>
    )
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
        <>
          <h1 className="text-xl font-bold dark:text-gray-100">Entry Pages</h1>

          <div className="my-4 border-b border-gray-300"></div>
          <main className="modal__content">
            <table className="w-max overflow-x-auto md:w-full table-striped table-fixed">
              <thead>
                <tr>
                  <th
                    className="p-2 w-48 md:w-56 lg:w-1/3 text-xs tracking-wide font-bold text-gray-500 dark:text-gray-400"
                    align="left"
                  >Page url
                  </th>
                  {this.showConversionRate() && <th className="p-2 w-32 text-xs tracking-wide font-bold text-gray-500 dark:text-gray-400" align="right" >Total Visitors </th>}
                  <th className="p-2 w-32 text-xs tracking-wide font-bold text-gray-500 dark:text-gray-400" align="right" >{this.label()} </th>
                  {this.showExtra() && <th className="p-2 w-32 text-xs tracking-wide font-bold text-gray-500 dark:text-gray-400" align="right" >Total Entrances </th>}
                  {this.showExtra() && <th className="p-2 w-32 text-xs tracking-wide font-bold text-gray-500 dark:text-gray-400" align="right" >Visit Duration </th>}
                  {this.showConversionRate() && <th className="p-2 w-32 text-xs tracking-wide font-bold text-gray-500 dark:text-gray-400" align="right" >CR </th>}
                </tr>
              </thead>
              <tbody>
                {this.state.pages.map(this.renderPage.bind(this))}
              </tbody>
            </table>
          </main>
        </>
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

export default withRouter(EntryPagesModal)
