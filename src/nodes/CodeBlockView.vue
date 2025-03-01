<template>
	<NodeViewWrapper as="div" :data-mode="viewMode" class="code-block">
		<div v-if="isEditable" class="code-block-header">
			<div class="view-switch">
				<NcActions :aria-label="t('text', 'Code block options')">
					<NcActionInput :label="t('text', 'Code block language')"
						:value="type"
						:show-trailing-button="false"
						:placeholder="t('text', 'e.g. php, javascript, json…')"
						@input="updateLanguage">
						<template #icon>
							<MarkerIcon :size="20" />
						</template>
					</NcActionInput>

					<NcActionSeparator v-if="supportPreview" />

					<NcActionButton v-if="supportPreview" :close-after-click="true" @click="viewMode = 'code'">
						<template #icon>
							<CodeBraces :size="20" />
						</template>
						{{ t('text', 'Source code') }}
					</NcActionButton>
					<NcActionButton v-if="supportPreview" :close-after-click="true" @click="viewMode = 'preview'">
						<template #icon>
							<Eye :size="20" />
						</template>
						{{ t('text', 'Diagram') }}
					</NcActionButton>
					<NcActionButton v-if="supportPreview" :close-after-click="true" @click="viewMode = 'side-by-side'">
						<template #icon>
							<ViewSplitVertical :size="20" />
						</template>
						{{ t('text', 'Both') }}
					</NcActionButton>

					<NcActionSeparator v-if="supportPreview" />

					<NcActionLink v-if="supportPreview" href="https://mermaid.js.org/intro/" target="_blank">
						<template #icon>
							<Help :size="20" />
						</template>
						{{ t('text', 'Mermaid documentation') }}
					</NcActionLink>
				</NcActions>
			</div>
		</div>
		<div :class="{'split-view': showCode && showPreview }">
			<pre v-show="showCode" class="split-view__code"><NodeViewContent as="code" :contenteditable="isEditable" /></pre>
			<div v-show="showPreview"
				ref="preview"
				class="split-view__preview"
				:contenteditable="false" />
			<div v-show="false" :id="targetId" :contenteditable="false" />
		</div>
	</NodeViewWrapper>
</template>

<script>
import debounce from 'debounce'
import { NodeViewWrapper, NodeViewContent } from '@tiptap/vue-2'
import { NcActions, NcActionButton, NcActionInput, NcActionLink, NcActionSeparator } from '@nextcloud/vue'
import mermaid from 'mermaid'
import { v4 as uuidv4 } from 'uuid'

import ViewSplitVertical from 'vue-material-design-icons/ViewSplitVertical.vue'
import CodeBraces from 'vue-material-design-icons/CodeBraces.vue'
import Eye from 'vue-material-design-icons/Eye.vue'
import MarkerIcon from 'vue-material-design-icons/Marker.vue'
import Help from 'vue-material-design-icons/Help.vue'

export default {
	// eslint-disable-next-line vue/match-component-file-name
	name: 'CodeBlockView',
	components: {
		MarkerIcon,
		Help,
		Eye,
		ViewSplitVertical,
		CodeBraces,
		NcActions,
		NcActionButton,
		NcActionInput,
		NcActionLink,
		NcActionSeparator,
		NodeViewWrapper,
		NodeViewContent,
	},
	props: {
		node: {
			type: Object,
			required: true,
		},
		editor: {
			type: Object,
			required: true,
		},
	},
	data() {
		return {
			isEditable: false,
			viewMode: 'preview',
			targetId: 'mermaid-view-' + uuidv4(),
		}
	},
	computed: {
		type() {
			return this.node?.attrs?.language || ''
		},
		supportPreview() {
			return ['mermaid'].includes(this.type)
		},
		showCode() {
			return !this.supportPreview || this.viewMode === 'code' || this.viewMode === 'side-by-side'
		},
		showPreview() {
			return this.supportPreview && (this.viewMode === 'preview' || this.viewMode === 'side-by-side')
		},
		defaultMode() {
			if (this.isEditable) {
				return 'side-by-side'
			} else {
				return this.supportPreview() ? 'code' : 'preview'
			}
		},
	},
	watch: {
		'node.textContent'() {
			this.renderMermaid()
		},
	},
	beforeMount() {
		this.isEditable = this.editor.isEditable
		this.editor.on('update', ({ editor }) => {
			this.isEditable = editor.isEditable
		})
		this.renderMermaidDebounced = debounce(async function() {
			if (!this.supportPreview) {
				this.viewMode = 'code'
				return
			}

			const textContent = this.node?.textContent || ''
			if (textContent.trim() === '') {
				this.viewMode = this.defaultMode
				this.$refs.preview.innerHTML = ''
			}

			try {
				await mermaid.parse(textContent)

				const { svg } = await mermaid.render(this.targetId, textContent)
				const targetElement = document.getElementById(this.targetId)
				if (targetElement) {
					targetElement.style.display = 'none'
				}
				this.$refs.preview.innerHTML = svg
			} catch (e) {
				console.debug('Invalid mermaid source', e)
				if (this.viewMode === 'preview') {
					this.viewMode = this.isEditable ? 'side-by-side' : 'code'
				}
			}
		}, 250)

		mermaid.initialize({ startOnLoad: false })
		this.$nextTick(() => {
			this.renderMermaid()
		})
	},
	methods: {
		updateLanguage(event) {
			this.updateAttributes({
				language: event.target.value,
			})
		},
		renderMermaid() {
			this.renderMermaidDebounced()
		},
	},
}
</script>
<style lang="scss" scoped>
.code-block {
	background-color: var(--color-background-dark);
}

.code-block-header {
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: stretch;
	position: absolute;
	right: 12px;
	margin-top: 4px;
}

.split-view {
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: stretch;
	gap: 12px;

	& > * {
		flex: 1;
	}

	&__preview {
		text-align: center;
	}
}

@media only screen and (max-width: 600px) {
	.split-view {
		flex-direction: column;
	}
}

.view-switch {
	display: flex;
	flex-direction: row;
}
</style>
