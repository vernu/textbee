import httpClient from '../lib/httpClient'

class StatsService {
  async getStats() {
    const res = await httpClient.get(`/gateway/stats`)
    return res.data.data
  }
}

export const statsService = new StatsService()
