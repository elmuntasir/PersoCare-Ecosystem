'use server'

import crypto from 'crypto'
import querystring from 'querystring'

const CONSUMER_KEY = process.env.FATSECRET_CONSUMER_KEY
const CONSUMER_SECRET = process.env.FATSECRET_CONSUMER_SECRET
const BASE_URL = 'https://platform.fatsecret.com/rest/server.api'

function generateOAuthSignature(method: string, url: string, params: Record<string, string>) {
  if (!CONSUMER_SECRET) return ''
  const sortedParams: Record<string, string> = { ...params, oauth_nonce: crypto.randomBytes(16).toString('hex') }
  const paramString = Object.keys(sortedParams)
    .sort()
    .map((key) => `${key}=${encodeURIComponent(sortedParams[key] || '')}`)
    .join('&')

  const signatureBase = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(paramString)}`
  const signingKey = `${CONSUMER_SECRET}&`

  return crypto.createHmac('sha1', signingKey).update(signatureBase).digest('base64')
}

export async function searchFoodExternal(query: string) {
  if (!CONSUMER_KEY || !CONSUMER_SECRET) {
    return []
  }

  const params: Record<string, string> = {
    oauth_consumer_key: CONSUMER_KEY,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_version: '1.0',
    method: 'foods.search',
    search_expression: query,
    format: 'json',
  }

  const signature = generateOAuthSignature('GET', BASE_URL, params)
  const oauthParams = { ...params, oauth_signature: signature }
  const url = `${BASE_URL}?${querystring.stringify(oauthParams)}`

  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`FatSecret API error: ${response.status}`)
    const data = await response.json()
    const foods = Array.isArray(data.foods?.food)
      ? data.foods.food
      : data.foods?.food
      ? [data.foods.food]
      : []

    return foods.map((f: any) => ({
      sourceId: String(f.food_id),
      source: 'FatSecret',
      name: f.food_name,
      brand: f.brand_name || null,
      category: null,
      nutrients: {
        calories: parseFloat(f.food_description?.match(/Calories:\s*([\d.]+)/i)?.[1] || '0'),
        protein: parseFloat(f.food_description?.match(/Protein:\s*([\d.]+)/i)?.[1] || '0'),
        carbs: parseFloat(f.food_description?.match(/Carbs:\s*([\d.]+)/i)?.[1] || '0'),
        fat: parseFloat(f.food_description?.match(/Fat:\s*([\d.]+)/i)?.[1] || '0'),
      },
      servingSize: null,
      unit: null,
    }))
  } catch (error) {
    console.error('FatSecret search error:', error)
    return []
  }
}

export async function getFoodDetailsExternal(foodId: string) {
  if (!CONSUMER_KEY || !CONSUMER_SECRET) {
    return null
  }

  const params: Record<string, string> = {
    oauth_consumer_key: CONSUMER_KEY,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_version: '1.0',
    method: 'food.get',
    food_id: foodId,
    format: 'json',
  }

  const signature = generateOAuthSignature('GET', BASE_URL, params)
  const oauthParams = { ...params, oauth_signature: signature }
  const url = `${BASE_URL}?${querystring.stringify(oauthParams)}`

  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const data = await response.json()
    return data.food || null
  } catch (error) {
    console.error('FatSecret detail error:', error)
    return null
  }
}
