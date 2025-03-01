<!--
  - @copyright Copyright (c) 2022 Max <max@nextcloud.com>
  -
  - @author Max <max@nextcloud.com>
  -
  - @license GNU AGPL version 3 or any later version
  -
  - This program is free software: you can redistribute it and/or modify
  - it under the terms of the GNU Affero General Public License as
  - published by the Free Software Foundation, either version 3 of the
  - License, or (at your option) any later version.
  -
  - This program is distributed in the hope that it will be useful,
  - but WITHOUT ANY WARRANTY; without even the implied warranty of
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  - GNU Affero General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with this program. If not, see <http://www.gnu.org/licenses/>.
  -
  -->

<template>
	<div class="text-editor__session-list">
		<div :title="lastSavedStatusTooltip" class="save-status" :class="saveStatusClass">
			<NcButton type="tertiary"
				:aria-label="t('text', 'Save document')"
				@click="onClickSave">
				<template #icon>
					<NcSavingIndicatorIcon :saving="saveStatusClass === 'saving'"
						:error="saveStatusClass === 'error'" />
				</template>
			</NcButton>
		</div>
		<SessionList :sessions="sessions">
			<p slot="lastSaved" class="last-saved">
				{{ t('text', 'Last saved') }}: {{ lastSavedString }}
			</p>
			<GuestNameDialog v-if="$isPublic && !currentSession.userId" :session="currentSession" />
		</SessionList>
	</div>
</template>

<script>

import { ERROR_TYPE } from '../../services/SyncService.js'
import moment from '@nextcloud/moment'
import { NcButton, NcSavingIndicatorIcon } from '@nextcloud/vue'
import {
	useIsMobileMixin,
	useIsPublicMixin,
	useSyncServiceMixin,
} from '../Editor.provider.js'
import refreshMoment from '../../mixins/refreshMoment.js'

export default {
	name: 'Status',

	components: {
		NcButton,
		NcSavingIndicatorIcon,
		SessionList: () => import(/* webpackChunkName: "editor-collab" */'./SessionList.vue'),
		GuestNameDialog: () => import(/* webpackChunkName: "editor-guest" */'./GuestNameDialog.vue'),
	},

	mixins: [
		useIsMobileMixin,
		useIsPublicMixin,
		useSyncServiceMixin,
		refreshMoment,
	],

	props: {
		hasConnectionIssue: {
			type: Boolean,
			require: true,
		},
		dirty: {
			type: Boolean,
			require: true,
		},
		document: {
			type: Object,
			default: null,
		},
		syncError: {
			type: Object,
			default: null,
		},
		sessions: {
			type: Object,
			default: () => { return {} },
		},
	},

	computed: {
		lastSavedStatus() {
			if (this.hasConnectionIssue) {
				return this.$isMobile
					? t('text', 'Offline')
					: t('text', 'Offline, changes will be saved when online')
			}
			return this.dirtyStateIndicator ? t('text', 'Saving …') : t('text', 'Saved')
		},
		dirtyStateIndicator() {
			return this.dirty || this.hasUnsavedChanges
		},
		lastSavedStatusTooltip() {
			let message = t('text', 'Last saved {lastSave}', { lastSave: this.lastSavedString })
			if (this.hasSyncCollission) {
				message = t('text', 'The document has been changed outside of the editor. The changes cannot be applied.')
			}
			if (this.dirty || this.hasUnsavedChanges) {
				message += ' - ' + t('text', 'Unsaved changes')
			}
			return message
		},

		hasUnsavedChanges() {
			return this.document && this.document.lastSavedVersion < this.document.currentVersion
		},
		hasSyncCollission() {
			return this.syncError && this.syncError.type === ERROR_TYPE.SAVE_COLLISSION
		},
		saveStatusClass() {
			if (this.syncError && this.lastSavedString !== '') {
				return 'error'
			}
			return this.dirtyStateIndicator ? 'saving' : 'saved'
		},
		currentSession() {
			return Object.values(this.sessions).find((session) => session.isCurrent)
		},
		lastSavedString() {
			// Make this a dependent of refreshMoment, so it will be recomputed
			/* eslint-disable-next-line no-unused-expressions */
			this.refreshMoment
			return moment(this.document.lastSavedVersionTime * 1000).fromNow()
		},
	},

	methods: {
		onClickSave() {
			if (this.dirtyStateIndicator) {
				this.$syncService.forceSave()
			}
		},
	},
}
</script>

<style scoped lang="scss">
	.text-editor__session-list {
		display: flex;

		input, div {
			vertical-align: middle;
			margin-left: 3px;
		}
	}

	.save-status {
		border-radius: 50%;
		color: var(--color-text-lighter);
		display: inline-flex;
		justify-content: center;
		padding: 0;
		height: 44px;
		width: 44px;

		&:hover {
			background-color: var(--color-background-hover);
		}
	}

	.last-saved {
		padding: 6px;
	}
</style>
