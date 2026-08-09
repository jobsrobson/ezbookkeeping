<template>
    <v-row class="about-page match-height">
        <v-col class="about-page__header-column" cols="12">
            <header class="about-page__header">
                <div class="about-page__header-top">
                    <div class="about-page__header-identity">
                        <div class="about-page__header-titles">
                            <h1>{{ tt('About') }}</h1>
                            <span>{{ tt('Your personal finance experience') }}</span>
                        </div>
                    </div>
                </div>
            </header>
        </v-col>

        <main class="about-content">
            <section class="about-overview-card">
                <div class="about-overview-card__intro">
                    <span class="about-eyebrow">Bookkeeping fork</span>
                    <img class="about-logo about-logo--light" src="/img/bookkeeping-logo-light.png" alt="Bookkeeping"/>
                    <img class="about-logo about-logo--dark" src="/img/bookkeeping-logo-dark.png" alt="Bookkeeping"/>
                    <p class="about-overview-card__description">
                        An independent fork focused on a refined, practical bookkeeping experience.
                    </p>
                    <div class="about-maintainer">
                        <span>Maintained by</span>
                        <strong>Robson Ricardo</strong>
                        <a target="_blank" href="https://github.com/jobsrobson">@jobsrobson</a>
                    </div>
                    <div class="about-overview-card__version">
                        <span>{{ tt('Version') }}</span>
                        <strong>{{ clientVersion }}</strong>
                    </div>
                    <div class="about-overview-card__build" v-if="clientBuildTime">
                        <span>{{ tt('Build Time') }}</span>
                        <strong>{{ clientBuildTime }}</strong>
                    </div>
                    <v-btn class="about-cache-button" color="default" variant="outlined"
                           :prepend-icon="mdiWebRefresh" @click="refreshBrowserCache"
                           v-if="!clientVersionMatchServerVersion">
                        {{ tt('Refresh Browser Cache') }}
                    </v-btn>
                </div>

                <div class="about-link-list">
                    <a href="https://github.com/jobsrobson" target="_blank">
                        <span>Developer GitHub</span>
                        <strong>github.com/jobsrobson</strong>
                    </a>
                    <div class="about-upstream-note">
                        <span class="about-eyebrow">Open-source foundation</span>
                        <p>
                            Bookkeeping is based on the original
                            <a href="https://github.com/mayswind/ezbookkeeping" target="_blank">ezBookkeeping</a>
                            project, created and maintained by
                            <a href="https://github.com/mayswind" target="_blank">@mayswind</a>.
                        </p>
                        <a class="about-upstream-docs" href="https://ezbookkeeping.mayswind.net" target="_blank">
                            Original project documentation
                        </a>
                    </div>
                </div>
            </section>

            <section class="about-provider-grid" v-if="(exchangeRatesData && !isUserCustomExchangeRates) || mapProviderName">
                <article class="about-provider-card" v-if="exchangeRatesData && !isUserCustomExchangeRates">
                    <span class="about-eyebrow">{{ tt('Exchange Rates Data') }}</span>
                    <span class="about-provider-card__label">{{ tt('Provider') }}</span>
                    <a :href="exchangeRatesData.referenceUrl" target="_blank" v-if="exchangeRatesData.referenceUrl">
                        {{ exchangeRatesData.dataSource }}
                    </a>
                    <strong v-else>{{ exchangeRatesData.dataSource }}</strong>
                </article>
                <article class="about-provider-card" v-if="mapProviderName">
                    <span class="about-eyebrow">{{ tt('Map') }}</span>
                    <span class="about-provider-card__label">{{ tt('Provider') }}</span>
                    <a :href="mapProviderWebsite" target="_blank" v-if="mapProviderWebsite">{{ mapProviderName }}</a>
                    <strong v-else>{{ mapProviderName }}</strong>
                </article>
            </section>

            <section class="about-license-card">
                <div class="about-section-heading">
                    <span class="about-eyebrow">{{ tt('License') }}</span>
                </div>

                <div class="about-license-copy">
                    <p>
                        <span :key="num" v-for="(line, num) in licenseLines"
                              :style="{ display: line ? 'initial' : 'block', padding: line ? '0' : '0 0 1em 0' }">
                            {{ line }}
                        </span>
                    </p>
                </div>

                <div class="about-community">
                    <div class="about-community__intro">
                        <span class="about-eyebrow">Community</span>
                        <p>Bookkeeping inherits the work of the ezBookkeeping community. These credits recognize contributors to the original codebase and its translations.</p>
                        <span class="about-provider-card__label">Original Project Maintainer</span>
                        <a target="_blank" href="https://github.com/mayswind">@mayswind</a>
                    </div>

                    <div class="about-table-section">
                        <h2>Code Contributors</h2>
                        <table class="contributors-table">
                            <thead><tr><th>Contributor</th></tr></thead>
                            <tbody>
                            <tr :key="index" v-for="(contributor, index) in contributors.code">
                                <td><a target="_blank" :href="`https://github.com/${contributor}`">@{{ contributor }}</a></td>
                            </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="about-table-section about-table-section--wide">
                        <h2>Translation Contributors</h2>
                        <div class="about-table-scroll">
                            <table class="contributors-table">
                                <thead><tr><th>Tag</th><th>Language</th><th>Contributors</th></tr></thead>
                                <tbody>
                                <tr :key="lang.languageTag" v-for="lang in allLanguages">
                                    <td>{{ lang.languageTag }}</td>
                                    <td>{{ lang.nativeDisplayName }}</td>
                                    <td>
                                        <template :key="contributor" v-for="(contributor, index) in contributors.translators[lang.languageTag] ?? []">
                                            <span v-if="index > 0">, </span>
                                            <a target="_blank" :href="`https://github.com/${contributor}`">@{{ contributor }}</a>
                                        </template>
                                        <span v-if="!contributors.translators[lang.languageTag]?.length">/</span>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="about-third-party">
                    <p>
                        Bookkeeping also contains additional third party software and illustration.<br/>
                        All the third party software / illustration included or linked is redistributed under the terms and conditions of their original licenses.
                    </p>
                    <div class="about-third-party__grid">
                        <article :key="licenseInfo.name" v-for="licenseInfo in thirdPartyLicenses">
                            <strong>{{ licenseInfo.name }}</strong>
                            <span v-if="licenseInfo.copyright">{{ licenseInfo.copyright }}</span>
                            <span v-if="licenseInfo.licenseUrl">{{ licenseInfo.license || 'License' }}:</span>
                            <a target="_blank" :href="licenseInfo.licenseUrl" v-if="licenseInfo.licenseUrl">{{ licenseInfo.licenseUrl }}</a>
                            <a target="_blank" :href="licenseInfo.url" v-if="licenseInfo.url">{{ licenseInfo.url }}</a>
                        </article>
                    </div>
                </div>
            </section>
        </main>
    </v-row>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import type { LanguageOption } from '@/locales/index.ts';
import { useI18n } from '@/locales/helpers.ts';
import { useAboutPageBase } from '@/views/base/AboutPageBase.ts';

import {
    mdiWebRefresh
} from '@mdi/js';

const { tt, getAllLanguageOptions } = useI18n();
const {
    clientVersion,
    clientVersionMatchServerVersion,
    clientBuildTime,
    exchangeRatesData,
    isUserCustomExchangeRates,
    mapProviderName,
    mapProviderWebsite,
    contributors,
    licenseLines,
    thirdPartyLicenses,
    refreshBrowserCache,
    init
} = useAboutPageBase();


const allLanguages = computed<LanguageOption[]>(() => getAllLanguageOptions(false));

init();
</script>

<style>
.about-page {
    width: calc(100% + 48px);
    min-width: 0;
    min-height: 100vh;
    margin: -24px !important;
    align-content: flex-start;
    background: rgb(var(--v-theme-background));
}

.about-page__header-column,
.about-page__column {
    min-width: 0;
    padding: 0 !important;
}

.about-page__header-column {
    padding: 0 !important;
}

.about-page__header {
    width: 100%;
    padding: 36px 40px 28px;
    border-bottom: 1px solid rgb(var(--v-theme-muted-border));
    background: rgb(var(--v-theme-surface));
}

.about-page__header-top {
    display: flex;
    width: 100%;
    min-width: 0;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
}

.about-page__header-identity {
    display: flex;
    min-width: 0;
    flex: 1 1 100%;
    align-items: center;
    gap: 12px;
}

.about-logo {
    width: min(263px, 42vw);
    height: auto;
    flex: 0 0 auto;
    margin-top: 18px;
}

.about-logo--dark {
    display: none;
}

.v-theme--dark .about-logo--light {
    display: none;
}

.v-theme--dark .about-logo--dark {
    display: block;
}

.about-page__header-titles h1 {
    margin: 0;
    color: rgb(var(--v-theme-on-surface));
    font-size: clamp(1.8rem, 3vw, 2.65rem);
    font-weight: 500;
    letter-spacing: -0.05em;
    line-height: 1;
}

.about-page__header-titles > span {
    display: block;
    margin-top: 10px;
    color: rgb(var(--v-theme-tertiary));
    font-size: 0.78rem;
    font-weight: 500;
}

.about-content {
    display: grid;
    width: 100%;
    min-width: 0;
    gap: 16px;
    padding: 24px 40px 56px;
}

.about-content a {
    color: rgb(var(--v-theme-highlight));
    text-decoration: none;
}

.about-content a:hover {
    text-decoration: underline;
}

.about-overview-card,
.about-provider-card,
.about-license-card {
    min-width: 0;
    border: 1px solid rgb(var(--v-theme-muted-border));
    border-radius: 10px;
    background: rgb(var(--v-theme-surface));
}

.about-overview-card {
    display: grid;
    grid-template-columns: minmax(260px, 0.75fr) minmax(0, 1.25fr);
}

.about-overview-card__intro {
    display: flex;
    min-width: 0;
    flex-direction: column;
    align-items: flex-start;
    padding: 28px;
    border-right: 1px solid rgb(var(--v-theme-muted-border));
}

.about-overview-card__description {
    max-width: 34rem;
    margin: 14px 0 0;
    color: rgb(var(--v-theme-tertiary));
    font-size: 0.88rem;
    line-height: 1.6;
}

.about-maintainer {
    display: grid;
    gap: 3px;
    margin-top: 24px;
}

.about-maintainer span {
    color: rgb(var(--v-theme-tertiary));
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
}

.about-maintainer strong {
    color: rgb(var(--v-theme-on-surface));
    font-size: 1rem;
}

.about-eyebrow,
.about-provider-card__label {
    color: rgb(var(--v-theme-tertiary));
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.045em;
    text-transform: uppercase;
}

.about-overview-card__version {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 24px;
}

.about-overview-card__version strong {
    color: rgb(var(--v-theme-on-surface));
    font-size: 1rem;
    font-weight: 500;
    letter-spacing: -0.02em;
    line-height: 1;
}

.about-overview-card__version span,
.about-overview-card__build span {
    color: rgb(var(--v-theme-tertiary));
    font-size: 0.76rem;
}

.about-overview-card__build {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-top: 22px;
    font-size: 0.82rem;
}

.about-cache-button {
    margin-top: 24px;
    border-radius: 6px !important;
    text-transform: none !important;
}

.about-link-list {
    display: grid;
    min-width: 0;
}

.about-link-list > a {
    display: flex;
    min-width: 0;
    flex-direction: column;
    justify-content: center;
    gap: 7px;
    padding: 20px 24px;
}

.about-link-list > a + a {
    border-top: 1px solid rgb(var(--v-theme-muted-border));
}

.about-link-list span {
    color: rgb(var(--v-theme-tertiary));
    font-size: 0.7rem;
    font-weight: 600;
}

.about-link-list strong {
    overflow: hidden;
    font-size: 0.84rem;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.about-upstream-note {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 24px;
    border-top: 1px solid rgb(var(--v-theme-muted-border));
}

.about-upstream-note p {
    margin: 10px 0;
    color: rgb(var(--v-theme-on-surface));
    font-size: 0.84rem;
    line-height: 1.6;
}

.about-upstream-note .about-upstream-docs {
    display: inline;
    padding: 0;
    font-size: 0.78rem;
}

.about-provider-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
}

.about-provider-card {
    display: flex;
    min-height: 132px;
    flex-direction: column;
    align-items: flex-start;
    padding: 24px;
}

.about-provider-card__label {
    margin-top: 24px;
    margin-bottom: 6px;
    text-transform: none;
}

.about-provider-card a,
.about-provider-card strong {
    font-size: 0.9rem;
    font-weight: 600;
}

.about-license-card {
    overflow: hidden;
}

.about-section-heading {
    padding: 20px 24px;
    border-bottom: 1px solid rgb(var(--v-theme-muted-border));
}

.about-license-copy,
.about-community,
.about-third-party {
    padding: 24px;
}

.about-license-copy {
    color: rgb(var(--v-theme-on-surface));
    font-size: 0.82rem;
    line-height: 1.7;
}

.about-community,
.about-third-party {
    border-top: 1px solid rgb(var(--v-theme-muted-border));
}

.about-community {
    display: grid;
    grid-template-columns: minmax(220px, 0.7fr) minmax(220px, 0.6fr) minmax(420px, 1.7fr);
    gap: 24px;
}

.about-community__intro p,
.about-third-party > p {
    margin: 14px 0 22px;
    color: rgb(var(--v-theme-tertiary));
    font-size: 0.8rem;
    line-height: 1.65;
}

.about-table-section h2 {
    margin: 0 0 12px;
    color: rgb(var(--v-theme-on-surface));
    font-size: 0.78rem;
    font-weight: 600;
}

.about-table-scroll {
    overflow-x: auto;
}

.contributors-table {
    width: 100%;
    overflow: hidden;
    border-collapse: collapse;
    font-size: 0.78rem;

    > thead > tr {
        > th:not(:first-child) {
            padding-inline-start: 10px;
        }

        > th:not(:last-child) {
            padding-inline-end: 10px;
        }
    }

    > thead > tr > th,
    > tbody > tr > td {
        padding: 9px 12px;
        border: 1px solid rgb(var(--v-theme-muted-border));
        text-align: start;
    }

    > thead > tr > th {
        color: rgb(var(--v-theme-tertiary));
        background: rgb(var(--v-theme-background));
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }
}

.about-third-party__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
}

.about-third-party__grid article {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 4px;
    padding: 14px 16px;
    border: 1px solid rgb(var(--v-theme-muted-border));
    border-radius: 7px;
    background: rgb(var(--v-theme-background));
    font-size: 0.75rem;
}

.about-third-party__grid article strong {
    margin-bottom: 3px;
    color: rgb(var(--v-theme-on-surface));
    font-size: 0.8rem;
}

.about-third-party__grid article span,
.about-third-party__grid article a {
    overflow-wrap: anywhere;
}

@media (max-width: 959.98px) {
    .about-page__header {
        padding: 24px 20px;
    }

    .about-content {
        padding: 20px 20px 44px;
    }

    .about-community {
        grid-template-columns: minmax(200px, 0.7fr) minmax(0, 1.3fr);
    }

    .about-table-section--wide {
        grid-column: 1 / -1;
    }
}

@media (max-width: 599.98px) {
    .about-page__header {
        padding: 20px 14px;
    }

    .about-page__header-titles h1 {
        font-size: 1.35rem;
    }

    .about-page__header-identity {
        flex-direction: column;
        align-items: flex-start;
        gap: 20px;
    }

    .about-logo {
        width: min(263px, 76vw);
    }

    .about-page__header-titles > span {
        display: none;
    }

    .about-content {
        gap: 12px;
        padding: 14px 14px 32px;
    }

    .about-overview-card,
    .about-provider-grid,
    .about-community,
    .about-third-party__grid {
        grid-template-columns: minmax(0, 1fr);
    }

    .about-overview-card__intro {
        padding: 22px;
        border-right: 0;
        border-bottom: 1px solid rgb(var(--v-theme-muted-border));
    }

    .about-link-list > a,
    .about-provider-card,
    .about-license-copy,
    .about-community,
    .about-third-party {
        padding: 18px;
    }

    .about-table-section--wide {
        grid-column: auto;
    }
}
</style>
