import { initUserAndFiles, randUser } from '../utils/index.js'

const user = randUser()

const createDirectEditingLink = (user, file) => {
	cy.login(user)
	return cy.request({
		method: 'POST',
		url: `${Cypress.env('baseUrl')}/ocs/v2.php/apps/files/api/v1/directEditing/open?format=json`,
		form: true,
		body: {
			path: file,
		},
		auth: { user: user.userId, pass: user.password },
		headers: {
			'OCS-ApiRequest': 'true',
			'Content-Type': 'application/x-www-form-urlencoded',
		},
	}).then(response => {
		cy.log(response)
		const token = response.body?.ocs?.data?.url
		cy.log(`Created direct editing token for ${user.userId}`, token)
		return cy.wrap(token)
	})
}

const createDirectEditingLinkForNewFile = (user, file) => {
	cy.login(user)
	return cy.request({
		method: 'POST',
		url: `${Cypress.env('baseUrl')}/ocs/v2.php/apps/files/api/v1/directEditing/create?format=json`,
		form: true,
		body: {
			path: file,
			editorId: 'text',
			creatorId: 'textdocument',
		},
		auth: { user: user.userId, pass: user.password },
		headers: {
			'OCS-ApiRequest': 'true',
			'Content-Type': 'application/x-www-form-urlencoded',
		},
	}).then(response => {
		cy.log(response)
		const token = response.body?.ocs?.data?.url
		cy.log(`Created direct editing token for ${user.userId}`, token)
		return cy.wrap(token)
	})
}

describe('direct editing', function() {

	const visitHooks = {
		onBeforeLoad(win) {
			win.DirectEditingMobileInterface = {
				close() {},
			}
		},
	}
	before(function() {
		initUserAndFiles(user, 'test.md', 'empty.md', 'empty.txt')
	})

	it('Open an existing file, edit it', () => {
		cy.intercept({ method: 'POST', url: '**/session/*/close' }).as('closeRequest')
		cy.intercept({ method: 'POST', url: '**/session/*/push' }).as('push')
		cy.intercept({ method: 'POST', url: '**/session/*/sync' }).as('sync')

		createDirectEditingLink(user, 'empty.md')
			.then((token) => {
				cy.logout()
				cy.visit(token, visitHooks)
			})
		cy.getContent().type('# This is a headline')
		cy.getContent().type('{enter}')
		cy.getContent().type('Some text')
		cy.getContent().type('{enter}')
		cy.getContent().type('{ctrl+s}')

		cy.wait('@push')
		cy.wait('@sync')

		cy.get('button.icon-close').click()
		cy.wait('@closeRequest')
			.then(() => {
				cy.getFileContent('empty.md').then((content) => {
					expect(content).to.equal('# This is a headline\n\nSome text')
				})
			})
	})

	it('Create a file, edit it', () => {
		cy.intercept({ method: 'POST', url: '**/session/*/close' }).as('closeRequest')
		cy.intercept({ method: 'POST', url: '**/session/*/push' }).as('push')
		cy.intercept({ method: 'POST', url: '**/session/*/sync' }).as('sync')

		createDirectEditingLinkForNewFile(user, 'newfile.md')
			.then((token) => {
				cy.logout()
				cy.visit(token, visitHooks)
			})

		cy.getContent().type('# This is a headline')
		cy.getContent().type('{enter}')
		cy.getContent().type('Some text')
		cy.getContent().type('{enter}')
		cy.getContent().type('{ctrl+s}')

		cy.wait('@push')
		cy.wait('@sync')

		cy.get('button.icon-close').click()
		cy.wait('@closeRequest')
			.then(() => {
				cy.getFileContent('newfile.md').then((content) => {
					expect(content).to.equal('# This is a headline\n\nSome text')
				})
			})
	})

	it('Open an existing plain text file, edit it', () => {
		cy.intercept({ method: 'POST', url: '**/session/*/close' }).as('closeRequest')
		cy.intercept({ method: 'POST', url: '**/session/*/push' }).as('push')
		cy.intercept({ method: 'POST', url: '**/session/*/sync' }).as('sync')

		createDirectEditingLink(user, 'empty.txt')
			.then((token) => {
				cy.logout()
				cy.visit(token, visitHooks)
			})

		cy.getContent().type('# This is a headline')
		cy.getContent().type('{enter}')
		cy.getContent().type('Some text')
		cy.getContent().type('{enter}')
		cy.getContent().type('{ctrl+s}')

		cy.wait('@push')
		cy.wait('@sync')

		cy.get('button.icon-close').click()
		cy.wait('@closeRequest')
			.then(() => {
				cy.getFileContent('empty.txt').then((content) => {
					expect(content).to.equal('# This is a headline\nSome text\n')
				})
			})
	})
})
