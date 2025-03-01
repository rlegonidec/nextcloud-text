<!--
  - @copyright Copyright (c) 2022 Vinicius Reis <vinicius@nextcloud.com>
  -
  - @author Vinicius Reis <vinicius@nextcloud.com>
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
	<NcActions class="entry-action entry-action__image-upload"
		:data-text-action-entry="actionEntry.key"
		:name="actionEntry.label"
		:title="actionEntry.label"
		:aria-label="actionEntry.label"
		:container="menuIDSelector"
		role="menu"
		aria-haspopup>
		<template #icon>
			<component :is="icon"
				:name="actionEntry.label"
				:aria-label="actionEntry.label"
				aria-haspopup />
		</template>
		<NcActionButton v-if="$editorUpload"
			close-after-click
			:disabled="isUploadingAttachments"
			:data-text-action-entry="`${actionEntry.key}-upload`"
			@click="$callChooseLocalAttachment">
			<template #icon>
				<Upload />
			</template>
			{{ t('text', 'Upload from computer') }}
		</NcActionButton>
		<NcActionButton v-if="!$isPublic"
			close-after-click
			:disabled="isUploadingAttachments"
			:data-text-action-entry="`${actionEntry.key}-insert`"
			@click="$callAttachmentPrompt">
			<template #icon>
				<Folder />
			</template>
			{{ t('text', 'Insert from Files') }}
		</NcActionButton>
	</NcActions>
</template>

<script>
import { NcActions, NcActionButton } from '@nextcloud/vue'
import { Loading, Folder, Upload } from '../icons.js'
import { useIsPublicMixin, useEditorUpload } from '../Editor.provider.js'
import { BaseActionEntry } from './BaseActionEntry.js'
import { useMenuIDMixin } from './MenuBar.provider.js'
import {
	useActionAttachmentPromptMixin,
	useUploadingStateMixin,
	useActionChooseLocalAttachmentMixin,
} from '../Editor/MediaHandler.provider.js'

export default {
	name: 'ActionAttachmentUpload',
	components: {
		NcActions,
		NcActionButton,
		Loading,
		Folder,
		Upload,
	},
	extends: BaseActionEntry,
	mixins: [
		useIsPublicMixin,
		useEditorUpload,
		useActionAttachmentPromptMixin,
		useUploadingStateMixin,
		useActionChooseLocalAttachmentMixin,
		useMenuIDMixin,
	],
	computed: {
		icon() {
			return this.isUploadingAttachments
				? Loading
				: this.actionEntry.icon
		},
		isUploadingAttachments() {
			return this.$uploadingState.isUploadingAttachments
		},
	},
}
</script>
