/**
 * @copyright Copyright (c) 2022 Max <max@nextcloud.com>
 *
 * @author Max <max@nextcloud.com>
 *
 * @license AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */
import axios from '@nextcloud/axios'
import { generateUrl } from '@nextcloud/router'

export class ConnectionClosedError extends Error {

	constructor(message = 'Close has already been called on the connection', ...rest) {
		super(message, ...rest)
	}

}

class SessionApi {

	#options

	constructor(options = {}) {
		this.#options = options
	}

	open({ fileId }) {
		return axios.put(this.#url(`session/${fileId}/create`), {
			fileId,
			filePath: this.#options.filePath,
			token: this.#options.shareToken,
			guestName: this.#options.guestName,
			forceRecreate: this.#options.forceRecreate,
		}).then(response => new Connection(response, this.#options))
	}

	#url(endpoint) {
		const isPublic = !!this.#options.shareToken
		return _endpointUrl(endpoint, isPublic)
	}

}

export class Connection {

	#content
	#closed
	#documentState
	#document
	#session
	#lock
	#readOnly
	#options

	constructor(response, options) {
		const { document, session, lock, readOnly, content, documentState } = response.data
		this.#document = document
		this.#session = session
		this.#lock = lock
		this.#readOnly = readOnly
		this.#content = content
		this.#documentState = documentState
		this.#options = options
		this.closed = false
	}

	get session() {
		return this.#session
	}

	get document() {
		return this.#document
	}

	get docStateVersion() {
		return this.#documentState ? this.#document.lastSavedVersion : 0
	}

	get state() {
		return {
			document: { ...this.#document, readOnly: this.#readOnly },
			session: this.#session,
			documentSource: this.#content || '',
			documentState: this.#documentState,
		}
	}

	get #defaultParams() {
		return {
			documentId: this.#document.id,
			sessionId: this.#session.id,
			sessionToken: this.#session.token,
			token: this.#options.shareToken,
		}
	}

	sync({ version }) {
		return this.#post(this.#url(`session/${this.#document.id}/sync`), {
			...this.#defaultParams,
			filePath: this.#options.filePath,
			version,
		})
	}

	save({ version, autosaveContent, documentState, force, manualSave }) {
		return this.#post(this.#url(`session/${this.#document.id}/save`), {
			...this.#defaultParams,
			filePath: this.#options.filePath,
			version,
			autosaveContent,
			documentState,
			force,
			manualSave,
		})
	}

	push({ steps, version, awareness }) {
		return this.#post(this.#url(`session/${this.#document.id}/push`), {
			...this.#defaultParams,
			filePath: this.#options.filePath,
			steps,
			version,
			awareness,
		})
	}

	// TODO: maybe return a new connection here so connections have immutable state
	update(guestName) {
		return this.#post(this.#url(`session/${this.#document.id}/session`), {
			...this.#defaultParams,
			guestName,
		}).then(({ data }) => {
			this.#session = data
		})
	}

	uploadAttachment(file) {
		const formData = new FormData()
		formData.append('file', file)
		const url = _endpointUrl('attachment/upload')
			+ '?documentId=' + encodeURIComponent(this.#document.id)
			+ '&sessionId=' + encodeURIComponent(this.#session.id)
			+ '&sessionToken=' + encodeURIComponent(this.#session.token)
			+ '&shareToken=' + encodeURIComponent(this.#options.shareToken || '')
		return this.#post(url, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		})
	}

	insertAttachmentFile(filePath) {
		return this.#post(_endpointUrl('attachment/filepath'), {
			documentId: this.#document.id,
			sessionId: this.#session.id,
			sessionToken: this.#session.token,
			filePath,
		})
	}

	close() {
		const promise = this.#post(this.#url(`session/${this.#document.id}/close`), this.#defaultParams)
		this.closed = true
		return promise
	}

	#post(...args) {
		if (this.closed) {
			return Promise.reject(new ConnectionClosedError())
		}
		return axios.post(...args)
	}

	#url(endpoint) {
		const isPublic = !!this.#defaultParams.token
		return _endpointUrl(endpoint, isPublic)
	}

}

/**
 *
 * @param {string} endpoint - endpoint of the url inside apps/text
 * @param {boolean} isPublic - public url or not
 */
function _endpointUrl(endpoint, isPublic = false) {
	const _baseUrl = generateUrl('/apps/text')
	if (isPublic) {
		return `${_baseUrl}/public/${endpoint}`
	}
	return `${_baseUrl}/${endpoint}`
}

export default SessionApi
