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
	<div class="document-status">
		<NcEmptyContent v-if="isLoadingError" :name="t('text', 'Failed to load file')" :description="syncError.data.data">
			<template #icon>
				<AlertOctagonOutline />
			</template>
		</NcEmptyContent>

		<p v-else-if="idle" class="msg">
			{{ t('text', 'Document idle for {timeout} minutes, click to continue editing', { timeout: IDLE_TIMEOUT }) }} <a class="button primary" @click="reconnect">{{ t('text', 'Reconnect') }}</a>
		</p>

		<p v-else-if="hasSyncCollission" class="msg icon-error">
			{{ t('text', 'The document has been changed outside of the editor. The changes cannot be applied.') }}
		</p>

		<p v-else-if="hasConnectionIssue" class="msg">
			{{ t('text', 'File could not be loaded. Please check your internet connection.') }} <a class="button primary" @click="reconnect">{{ t('text', 'Reconnect') }}</a>
		</p>

		<p v-if="lock" class="msg msg-locked">
			<Lock /> {{ t('text', 'This file is opened read-only as it is currently locked by {user}.', { user: lock.displayName }) }}
		</p>

		<CollisionResolveDialog v-if="hasSyncCollission" :sync-error="syncError" />
	</div>
</template>

<script>

import { ERROR_TYPE, IDLE_TIMEOUT } from './../../services/SyncService.js'
import AlertOctagonOutline from 'vue-material-design-icons/AlertOctagonOutline.vue'
import Lock from 'vue-material-design-icons/Lock.vue'
import { NcEmptyContent } from '@nextcloud/vue'
import CollisionResolveDialog from '../CollisionResolveDialog.vue'

export default {
	name: 'DocumentStatus',

	components: {
		CollisionResolveDialog,
		AlertOctagonOutline,
		Lock,
		NcEmptyContent,
	},

	props: {
		idle: {
			type: Boolean,
			require: true,
		},
		lock: {
			type: Object,
			default: null,
		},
		syncError: {
			type: Object,
			default: null,
		},
		hasConnectionIssue: {
			type: Boolean,
			require: true,
		},
	},

	data() {
		return {
			IDLE_TIMEOUT,
		}
	},

	computed: {
		hasSyncCollission() {
			return this.syncError && this.syncError.type === ERROR_TYPE.SAVE_COLLISSION
		},
		isLoadingError() {
			return this.syncError && this.syncError.type === ERROR_TYPE.LOAD_ERROR
		},
	},

	methods: {
		reconnect() {
			this.$emit('reconnect')
		},
	},

}
</script>

<style scoped lang="scss">
	.document-status {
		position: sticky;
		top: 0;
		z-index: 10000;
		max-height: 50px;
		background-color: var(--color-main-background);

		.msg {
			padding: 12px;
			background-position: 8px center;
			color: var(--color-text-maxcontrast);

			&.icon-error {
				padding-left: 30px;
			}

			.button {
				margin-left: 8px;
			}

			&.msg-locked .lock-icon {
				padding: 0 10px;
				float: left;
			}
		}
	}
</style>
