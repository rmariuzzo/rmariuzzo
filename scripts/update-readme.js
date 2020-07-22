#!/usr/bin/env node
const got = require('got')
const path = require('path')
const execa = require('execa')
const numeral = require('numeral')
const { GraphQLClient } = require('graphql-request')

const rootPath = path.join(__dirname, '..')

;(async() => {
  const stackExchangeResponse = await got('https://api.stackexchange.com/2.2/users/439427', {
    responseType: 'json',
    searchParams: {
      key: process.env.STACK_EXCHANGE_KEY,
      site: 'stackoverflow',
      order: 'desc',
      sort: 'reputation',
      filter: 'default'
    }
  })

  const [{ link, reputation }] = stackExchangeResponse.body.items

  const gitHubClient = new GraphQLClient('https://api.github.com/graphql', {
    headers: {
      Authorization: `bearer ${process.env.GITHUB_TOKEN}`,
    },
    method: 'POST'
  })

  const gitHubResponse = await gitHubClient.request(`
    {
      viewer {
        login
        repositories(privacy: PUBLIC, ownerAffiliations: OWNER, isFork: false) {
          totalCount
        }
      }
    }
  `)

  const { viewer: { repositories } } = gitHubResponse
  
  await execa('untoken', [
    path.join(rootPath, './README.template.md'),
    path.join(rootPath, './README.md'),
    '--so_link', link,
    '--so_reputation', numeral(reputation).format('0.0a'),
    '--gh_repos_count', repositories.totalCount
  ], { cwd: rootPath, preferLocal: true })
})()