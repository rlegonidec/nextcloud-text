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
	<NcActions :title="tooltip"
		class="entry-list-action entry-action"
		role="menu"
		v-bind="state"
		:container="menuIDSelector"
		:aria-label="actionEntry.label"
		:aria-pressed="state.active"
		:type="state.active ? 'primary': 'tertiary'"
		:aria-activedescendant="currentChild ? `${$menuID}-child-${currentChild.key}` : null"
		:force-menu="true"
		:name="actionEntry.label"
		:data-text-action-entry="actionEntry.key"
		:data-text-action-active="activeKey"
		@update:open="onOpenChange">
		<template #icon>
			<component :is="icon" :key="iconKey" />
		</template>
		<ActionSingle v-for="child in children"
			:id="`${$menuID}-child-${child.key}`"
			:key="`child-${child.key}`"
			:active="currentChild?.key === child.key"
			is-item
			:action-entry="child"
			v-on="$listeners"
			@trigged="onTrigger" />
		<slot v-bind="{ visible }" name="lastAction" />
	</NcActions>
</template>

<script>
import { NcActions } from '@nextcloud/vue'
import { BaseActionEntry } from './BaseActionEntry.js'
import ActionSingle from './ActionSingle.vue'
import { getIsActive } from './utils.js'
import { useOutlineStateMixin } from '../Editor/Wrapper.provider.js'
import useStore from '../../mixins/store.js'
import { useMenuIDMixin } from './MenuBar.provider.js'

export default {
	name: 'ActionList',
	components: {
		NcActions,
		ActionSingle,
	},
	extends: BaseActionEntry,
	mixins: [useStore, useOutlineStateMixin, useMenuIDMixin],
	data: () => ({
		visible: false,
	}),
	computed: {
		currentChild() {
			const {
				state,
				$editor,
				actionEntry: { children },
			} = this

			if (!state.active) {
				return null
			}

			return children.find(child => {
				return getIsActive(child, $editor)
			})
		},
		icon() {
			if (this.currentChild) {
				return this.currentChild.icon
			}

			return this.actionEntry.icon
		},
		iconKey() {
			return `${this.actionEntry.key}/${this.activeKey}`
		},
		activeKey() {
			return this.currentChild?.key
		},
		children() {
			return this.actionEntry.children.filter(({ visible }) => {
				if (visible === undefined) {
					return true
				}

				return typeof visible === 'function'
					? visible(this)
					: visible
			})
		},
	},
	methods: {
		onOpenChange(val) {
			this.visible = val
		},
		runAction() {
			// nothing todo
		},
		onTrigger(entry) {
			if (entry?.click) {
				return
			}
			this.$editor.chain().focus().run()
			this.$emit('trigged', entry)
		},
	},
}
</script>
