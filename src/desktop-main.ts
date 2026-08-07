import { createApp, ref } from 'vue';
import '@fontsource-variable/google-sans-flex/wght.css';
import { createPinia } from 'pinia';
import { type I18n, type Composer, createI18n } from 'vue-i18n';

import { createVuetify } from 'vuetify';
import { VAlert } from 'vuetify/components/VAlert';
import { VApp } from 'vuetify/components/VApp';
import { VAvatar } from 'vuetify/components/VAvatar';
import { VAutocomplete } from 'vuetify/components/VAutocomplete';
import { VBadge } from 'vuetify/components/VBadge';
import { VBtn } from 'vuetify/components/VBtn';
import { VBtnGroup } from 'vuetify/components/VBtnGroup';
import { VBtnToggle } from 'vuetify/components/VBtnToggle';
import { VCard, VCardActions, VCardItem, VCardSubtitle, VCardText, VCardTitle } from 'vuetify/components/VCard';
import { VCheckbox, VCheckboxBtn } from 'vuetify/components/VCheckbox';
import { VChip } from 'vuetify/components/VChip';
import { VDataTable } from 'vuetify/components/VDataTable';
import { VDialog } from 'vuetify/components/VDialog';
import { VDivider } from 'vuetify/components/VDivider';
import { VExpansionPanel, VExpansionPanelText, VExpansionPanelTitle, VExpansionPanels } from 'vuetify/components/VExpansionPanel';
import { VForm } from 'vuetify/components/VForm';
import { VContainer, VCol, VRow, VSpacer } from 'vuetify/components/VGrid';
import { VIcon } from 'vuetify/components/VIcon';
import { VImg } from 'vuetify/components/VImg';
import { VInput } from 'vuetify/components/VInput';
import { VLabel } from 'vuetify/components/VLabel';
import { VLayout } from 'vuetify/components/VLayout';
import { VList, VListGroup, VListImg, VListItem, VListItemAction, VListItemMedia, VListItemSubtitle, VListItemTitle, VListSubheader } from 'vuetify/components/VList';
import { VMain } from 'vuetify/components/VMain';
import { VMenu } from 'vuetify/components/VMenu';
import { VNavigationDrawer } from 'vuetify/components/VNavigationDrawer';
import { VOverlay } from 'vuetify/components/VOverlay';
import { VPagination } from 'vuetify/components/VPagination';
import { VProgressCircular } from 'vuetify/components/VProgressCircular';
import { VProgressLinear } from 'vuetify/components/VProgressLinear';
import { VSelect } from 'vuetify/components/VSelect';
import { VSkeletonLoader } from 'vuetify/components/VSkeletonLoader';
import { VSlideGroup, VSlideGroupItem } from 'vuetify/components/VSlideGroup';
import { VSnackbar } from 'vuetify/components/VSnackbar';
import { VSwitch } from 'vuetify/components/VSwitch';
import { VTabs, VTab } from 'vuetify/components/VTabs';
import { VTable } from 'vuetify/components/VTable';
import { VTextarea } from 'vuetify/components/VTextarea';
import { VTextField } from 'vuetify/components/VTextField';
import { VToolbar } from 'vuetify/components/VToolbar';
import { VTooltip } from 'vuetify/components/VTooltip';
import { VWindow, VWindowItem } from 'vuetify/components/VWindow';
import type { LocaleInstance } from 'vuetify/lib/framework.d.ts';

import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import 'vuetify/styles';

import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import {
    LineChart,
    BarChart,
    PieChart,
    ScatterChart,
    BoxplotChart,
    CandlestickChart,
    RadarChart,
    TreemapChart,
    SunburstChart,
    HeatmapChart,
    SankeyChart
} from 'echarts/charts';
import {
    GridComponent,
    CalendarComponent,
    TooltipComponent,
    LegendComponent,
    VisualMapComponent
} from 'echarts/components';
import VChart from 'vue-echarts';

import 'line-awesome/dist/line-awesome/css/line-awesome.css';

import { PerfectScrollbar } from 'vue3-perfect-scrollbar';

import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

import draggable from 'vuedraggable';

import router from '@/router/desktop.ts';

import { DecimalSeparator } from '@/core/numeral.ts';
import { getI18nOptions, getRtlLocales } from '@/locales/helpers.ts';

import PinCodeInput from '@/components/common/PinCodeInput.vue';
import MapView from '@/components/common/MapView.vue';
import DateTimePicker from '@/components/common/DateTimePicker.vue';
import MonthPicker from '@/components/common/MonthPicker.vue';
import TransactionCalendar from '@/components/common/TransactionCalendar.vue';

import ItemIcon from '@/components/desktop/ItemIcon.vue';
import BtnVerticalGroup from '@/components/desktop/BtnVerticalGroup.vue';
import NumberInput from '@/components/desktop/NumberInput.vue';
import AmountInput from '@/components/desktop/AmountInput.vue';
import AmountInputDialog from '@/components/desktop/AmountInputDialog.vue';
import LanguageSelect from '@/components/desktop/LanguageSelect.vue';
import LanguageSelectButton from '@/components/desktop/LanguageSelectButton.vue';
import CurrencySelect from '@/components/desktop/CurrencySelect.vue';
import DateTimeSelect from '@/components/desktop/DateTimeSelect.vue';
import DateSelect from '@/components/desktop/DateSelect.vue';
import FiscalYearStartSelect from '@/components/desktop/FiscalYearStartSelect.vue';
import ColorSelect from '@/components/desktop/ColorSelect.vue';
import IconSelect from '@/components/desktop/IconSelect.vue';
import TwoColumnSelect from '@/components/desktop/TwoColumnSelect.vue';
import TransactionTagAutoComplete from '@/components/desktop/TransactionTagAutoComplete.vue';
import ScheduleFrequencySelect from '@/components/desktop/ScheduleFrequencySelect.vue';
import StepsBar from '@/components/desktop/StepsBar.vue';
import ConfirmDialog from '@/components/desktop/ConfirmDialog.vue';
import SnackBar from '@/components/desktop/SnackBar.vue';
import PieChartComponent from '@/components/desktop/PieChart.vue';
import RadarChartComponent from '@/components/desktop/RadarChart.vue';
import AxisChart from '@/components/desktop/AxisChart.vue';
import TrendsChart from '@/components/desktop/TrendsChart.vue';
import HierarchyChart from '@/components/desktop/HierarchyChart.vue';
import HeatMapChart from '@/components/desktop/HeatMapChart.vue';
import CalendarHeatMapChart from '@/components/desktop/CalendarHeatMapChart.vue';
import RenameDialog from '@/components/desktop/RenameDialog.vue';
import DateRangeSelectionDialog from '@/components/desktop/DateRangeSelectionDialog.vue';
import MonthSelectionDialog from '@/components/desktop/MonthSelectionDialog.vue';
import MonthRangeSelectionDialog from '@/components/desktop/MonthRangeSelectionDialog.vue';
import AccountBalanceTrendsChart from '@/components/desktop/AccountBalanceTrendsChart.vue';
import AccountAndCategorySankeyChart from '@/components/desktop/AccountAndCategorySankeyChart.vue';
import SwitchToMobileDialog from '@/components/desktop/SwitchToMobileDialog.vue';

import TextFieldAutoWidth from '@/directives/desktop/textfieldAutoWidth.ts';

import '@/styles/desktop/template/vuetify/index.scss';
import '@/styles/desktop/template/template/index.scss';
import '@/styles/desktop/template/layout/index.scss';
import '@/styles/desktop/template/layout/component/index.scss';
import '@/styles/desktop/template/layout/_default-layout.scss';
import '@/styles/desktop/global.scss';
import '@/styles/desktop/font-size.scss';
import '@/styles/desktop/amount-color.scss';

import App from './DesktopApp.vue';

const app = createApp(App);
const pinia = createPinia();
const i18n = createI18n(getI18nOptions()) as I18n<Record<string, unknown>, Record<string, unknown>, Record<string, unknown>, string, false>;
const vuetify = createVuetify({
    components: {
        VAlert,
        VApp,
        VAvatar,
        VAutocomplete,
        VBadge,
        VBtn,
        VBtnGroup,
        VBtnToggle,
        VCard,
        VCardActions,
        VCardItem,
        VCardSubtitle,
        VCardText,
        VCardTitle,
        VCheckbox,
        VCheckboxBtn,
        VChip,
        VDataTable,
        VDialog,
        VDivider,
        VExpansionPanel,
        VExpansionPanelText,
        VExpansionPanelTitle,
        VExpansionPanels,
        VForm,
        VContainer,
        VCol,
        VRow,
        VSpacer,
        VIcon,
        VImg,
        VInput,
        VLabel,
        VLayout,
        VList,
        VListGroup,
        VListImg,
        VListItem,
        VListItemAction,
        VListItemMedia,
        VListItemSubtitle,
        VListItemTitle,
        VListSubheader,
        VMain,
        VMenu,
        VNavigationDrawer,
        VOverlay,
        VPagination,
        VProgressCircular,
        VProgressLinear,
        VSelect,
        VSkeletonLoader,
        VSlideGroup,
        VSlideGroupItem,
        VSnackbar,
        VSwitch,
        VTabs,
        VTab,
        VTable,
        VTextarea,
        VTextField,
        VToolbar,
        VTooltip,
        VWindow,
        VWindowItem
    },
    icons: {
        defaultSet: 'mdi',
        aliases,
        sets: {
            mdi
        }
    },
    defaults: {
        VAlert: {
            VBtn: {
                color: undefined
            }
        },
        VAutocomplete: {
            variant: 'outlined',
            density: 'comfortable',
            color: 'primary',
            hideDetails: 'auto'
        },
        VAvatar: {
            variant: 'flat',
            VIcon: {
                size: 24,
            },
        },
        VBadge: {
            color: 'primary'
        },
        VBtn: {
            color: 'primary'
        },
        VCheckbox: {
            color: 'primary',
            hideDetails: 'auto'
        },
        VChip: {
            elevation: 0
        },
        VList: {
            color: 'primary'
        },
        VPagination: {
            density: 'comfortable',
            activeColor: 'primary'
        },
        VRadio: {
            density: 'comfortable',
            color: 'primary',
            hideDetails: 'auto'
        },
        VSelect: {
            variant: 'outlined',
            density: 'comfortable',
            color: 'primary',
            hideDetails: 'auto'
        },
        VSlider: {
            color: 'primary',
            hideDetails: 'auto'
        },
        VSwitch: {
            inset: true,
            color: 'primary',
            hideDetails: 'auto'
        },
        VProgressCircular: {
            size: 40
        },
        VSnackbar: {
            timeout: 3000
        },
        VTable: {
            hover: true
        },
        VTabs: {
            color: 'primary',
            VSlideGroup: {
                showArrows: true
            }
        },
        VTextarea: {
            variant: 'outlined',
            density: 'comfortable',
            color: 'primary',
            hideDetails: 'auto'
        },
        VTextField: {
            variant: 'outlined',
            density: 'comfortable',
            color: 'primary',
            hideDetails: 'auto'
        },
        VToolbar: {
            color: 'primary'
        },
        VTooltip: {
            location: 'top'
        },
        VWindow: {
            touch: false
        }
    },
    
    theme: {
    defaultTheme: 'light',

    themes: {
        light: {
            dark: false,

            colors: {
                default: '#000000',
                'default-darken': '#000000',
                'on-default': '#ffffff',

                primary: '#00ff9c',
                'primary-darken-1': '#00E68C',
                'on-primary': '#003822',

                primarymuted: '#B8D9CC',
                'primary-muted-darken-1': '#92b4a6',
                'on-primary-muted': '#003822',

                secondary: '#f1f1ef',
                'secondary-darken-1': '#dbdbdb',
                'on-secondary': '#2c2d2a',

                tertiary: '#66736E',
                'tertiary-darken-1': '#4F5A56',
                'on-tertiary': '#FFFFFF',

                highlight: '#05633f',

                income: '#268A67',
                expense: '#ff5500',

                border: '#d5d2ca',
                'on-hover-border': '#9a9891',
                'on-hover-background': '#fbfaf7',
                'muted-border': '#e7e5df',

                verticalbutton: '#f8f7f4',
                'on-verticalbutton-background': '#1a1909',
                'verticalbutton-hover': '#f4f2f0',
                'verticalbutton-selected': '#d8d7d5',

                'sidebar-selected': '#ebe7e4',
                'sidebar-hover': '#f4f2f0',
                'on-sidebar-selected': '#252521',
                'on-sidebar-selected-text': '#252521',

                success: '#268A67',
                'success-darken-1': '#1F7055',
                'on-success': '#FFFFFF',

                info: '#426B8A',
                'info-darken-1': '#355871',
                'on-info': '#FFFFFF',

                warning: '#A66A2C',
                'warning-darken-1': '#875522',
                'on-warning': '#FFFFFF',

                error: '#C4514F',
                'error-darken-1': '#A64140',
                'on-error': '#FFFFFF',

                teal: '#2E7768',

                background: '#fbfaf7',
                'on-background': '#1C211F',

                surface: '#ffffff',
                'on-surface': '#1C211F',

                'notification-background': '#FFFFFF',
                'on-notification-background': '#1C211F',

                grey: '#737A77',
                'grey-50': '#F8F8F5',
                'grey-100': '#F0F1ED',
                'grey-200': '#E3E5E0',
                'grey-300': '#D1D4CE',
                'grey-400': '#AEB4AF',
                'grey-500': '#858D88',
                'grey-600': '#69716C',
                'grey-700': '#505753',
                'grey-800': '#343A37',
                'grey-900': '#1C211F',

                'perfect-scrollbar-thumb': '#C7CBC6',

                'skin-bordered-background': '#FFFFFF',
                'skin-bordered-surface': '#FFFFFF',

                'expansion-panel-text-custom-bg': '#F6F6F2'
            },

            variables: {
                'sidebar-bg': '#f4f3ef',
                'code-color': '#255C4E',

                'overlay-scrim-background': '#17201D',
                'tooltip-background': '#202724',
                'tooltip-color': '#FFFFFF',

                'overlay-scrim-opacity': 0.46,

                'hover-opacity': 0.04,
                'focus-opacity': 0.08,
                'selected-opacity': 0.07,
                'activated-opacity': 0.1,
                'pressed-opacity': 0.1,
                'dragged-opacity': 0.08,
                'disabled-opacity': 0.4,

                'border-color': '#59635E',
                'border-opacity': 0.1,

                'table-header-color': '#F6F6F2',

                'high-emphasis-opacity': 0.92,
                'medium-emphasis-opacity': 0.66,

                'shadow-key-umbra-color': '#000000',
                'shadow-xs-opacity': '0',
                'shadow-sm-opacity': '0',
                'shadow-md-opacity': '0',
                'shadow-lg-opacity': '0',
                'shadow-xl-opacity': '0'
            }
        },

        dark: {
            dark: true,

            colors: {
                default: '#ffffff',
                'default-darken': '#e8e8e5',
                'on-default': '#111512',

                primary: '#00ff9c',
                'primary-darken-1': '#00E68C',
                'on-primary': '#003822',

                primarymuted: '#294A3E',
                'primary-muted-darken-1': '#213D33',
                'on-primary-muted': '#B8F5DC',

                secondary: '#292A27',
                'secondary-darken-1': '#343532',
                'on-secondary': '#F1F1EF',

                tertiary: '#9AA6A1',
                'tertiary-darken-1': '#7F8B86',
                'on-tertiary': '#111512',

                highlight: '#00C779',

                income: '#00C779',
                expense: '#FF7040',

                border: '#3D413E',
                'on-hover-border': '#666B67',
                'on-hover-background': '#242522',
                'muted-border': '#30322F',

                verticalbutton: '#222320',
                'on-verticalbutton-background': '#F1F1ED',
                'verticalbutton-hover': '#2A2B28',
                'verticalbutton-selected': '#363936',

                'sidebar-selected': '#30312E',
                'sidebar-hover': '#292A27',
                'on-sidebar-selected': '#F1F1ED',
                'on-sidebar-selected-text': '#F1F1ED',

                success: '#48B991',
                'success-darken-1': '#389876',
                'on-success': '#071D15',

                info: '#6E9EC2',
                'info-darken-1': '#5684A6',
                'on-info': '#0B1821',

                warning: '#D69A57',
                'warning-darken-1': '#B77E3E',
                'on-warning': '#211407',

                error: '#E0716F',
                'error-darken-1': '#C45C5A',
                'on-error': '#260B0A',

                teal: '#4DA38F',

                background: '#171815',
                'on-background': '#E8E9E5',

                surface: '#1D1E1B',
                'on-surface': '#E8E9E5',

                'notification-background': '#242522',
                'on-notification-background': '#E8E9E5',

                grey: '#969D98',
                'grey-50': '#1B1C19',
                'grey-100': '#222320',
                'grey-200': '#2C2E2A',
                'grey-300': '#3B3E3A',
                'grey-400': '#565B57',
                'grey-500': '#737A75',
                'grey-600': '#969D98',
                'grey-700': '#B5BAB5',
                'grey-800': '#D1D4CF',
                'grey-900': '#ECEDE9',

                'perfect-scrollbar-thumb': '#484C48',

                'skin-bordered-background': '#171815',
                'skin-bordered-surface': '#1D1E1B',

                'expansion-panel-text-custom-bg': '#222320'
            },

            variables: {
                'sidebar-bg': '#1A1B18',
                'code-color': '#73C9AC',

                'overlay-scrim-background': '#000000',
                'tooltip-background': '#ECEDE9',
                'tooltip-color': '#171815',

                'overlay-scrim-opacity': 0.62,

                'hover-opacity': 0.06,
                'focus-opacity': 0.10,
                'selected-opacity': 0.09,
                'activated-opacity': 0.12,
                'pressed-opacity': 0.12,
                'dragged-opacity': 0.10,
                'disabled-opacity': 0.4,

                'border-color': '#A8AEA9',
                'border-opacity': 0.14,

                'table-header-color': '#222320',

                'high-emphasis-opacity': 0.94,
                'medium-emphasis-opacity': 0.68,

                'shadow-key-umbra-color': '#000000',
                'shadow-xs-opacity': '0',
                'shadow-sm-opacity': '0',
                'shadow-md-opacity': '0',
                'shadow-lg-opacity': '0',
                'shadow-xl-opacity': '0'
            }
                    },
                }
            },
    locale: {
        rtl: getRtlLocales(),
        adapter: ((i18nGlobal: Composer) => {
            const instance: LocaleInstance = {
                name: 'Bookkeeping i18n',
                decimalSeparator: ref<string>(DecimalSeparator.Default.symbol), // should never use vuetify to format numbers
                messages: i18nGlobal.messages,
                current: i18nGlobal.locale,
                fallback: i18nGlobal.locale, // no need to let vuetify know what fallback locale is
                t: (key: string, ...params: unknown[]): string => {
                    if (!key) {
                        return '';
                    }

                    if (!key.startsWith('$vuetify.')) {
                        return key;
                    }

                    key = key.substring(9); // remove '$vuetify.' prefix
                    const mappedTextKey = vuetifyI18nTextKeyMap[key];

                    if (!mappedTextKey) {
                        return key;
                    }

                    if (params && params.length > 0) {
                        // @ts-expect-error the arguments passed in are compatible with vue-i18n method arguments
                        return i18nGlobal.t(mappedTextKey, ...params);
                    } else {
                        return i18nGlobal.t(mappedTextKey);
                    }
                },
                n: (value: number): string => {
                    return i18nGlobal.n(value);
                },
                provide: (): LocaleInstance => {
                    return instance;
                }
            };

            return instance;
        })(i18n.global) as LocaleInstance,
    }
});

// key is in the original i18n text of vuetify (in vuetify/lib/locale/en.js), value is the text in the Bookkeeping i18n files
const vuetifyI18nTextKeyMap: Record<string, string> = {
    'open': 'Open',
    'close': 'Close'
}

echarts.use([
    CanvasRenderer,
    LineChart,
    BarChart,
    PieChart,
    ScatterChart,
    BoxplotChart,
    CandlestickChart,
    RadarChart,
    TreemapChart,
    SunburstChart,
    HeatmapChart,
    SankeyChart,
    GridComponent,
    CalendarComponent,
    TooltipComponent,
    LegendComponent,
    VisualMapComponent
]);

app.use(pinia);
app.use(i18n);
app.use(vuetify);
app.use(router);

app.component('VChart', VChart);
app.component('PerfectScrollbar', PerfectScrollbar);
app.component('VueDatePicker', VueDatePicker);
app.component('DraggableList', draggable);

app.component('PinCodeInput', PinCodeInput);
app.component('MapView', MapView);
app.component('DateTimePicker', DateTimePicker);
app.component('MonthPicker', MonthPicker);
app.component('TransactionCalendar', TransactionCalendar);

app.component('ItemIcon', ItemIcon);
app.component('BtnVerticalGroup', BtnVerticalGroup);
app.component('NumberInput', NumberInput);
app.component('AmountInput', AmountInput);
app.component('AmountInputDialog', AmountInputDialog);
app.component('LanguageSelect', LanguageSelect);
app.component('LanguageSelectButton', LanguageSelectButton);
app.component('CurrencySelect', CurrencySelect);
app.component('DateTimeSelect', DateTimeSelect);
app.component('DateSelect', DateSelect);
app.component('FiscalYearStartSelect', FiscalYearStartSelect);
app.component('ColorSelect', ColorSelect);
app.component('IconSelect', IconSelect);
app.component('TwoColumnSelect', TwoColumnSelect);
app.component('TransactionTagAutoComplete', TransactionTagAutoComplete);
app.component('ScheduleFrequencySelect', ScheduleFrequencySelect);
app.component('StepsBar', StepsBar);
app.component('ConfirmDialog', ConfirmDialog);
app.component('SnackBar', SnackBar);
app.component('PieChart', PieChartComponent);
app.component('RadarChart', RadarChartComponent);
app.component('AxisChart', AxisChart);
app.component('TrendsChart', TrendsChart);
app.component('HierarchyChart', HierarchyChart);
app.component('HeatMapChart', HeatMapChart);
app.component('CalendarHeatMapChart', CalendarHeatMapChart);
app.component('RenameDialog', RenameDialog);
app.component('DateRangeSelectionDialog', DateRangeSelectionDialog);
app.component('MonthSelectionDialog', MonthSelectionDialog);
app.component('MonthRangeSelectionDialog', MonthRangeSelectionDialog);
app.component('AccountBalanceTrendsChart', AccountBalanceTrendsChart);
app.component('AccountAndCategorySankeyChart', AccountAndCategorySankeyChart);
app.component('SwitchToMobileDialog', SwitchToMobileDialog);

app.directive('TextFieldAutoWidth', TextFieldAutoWidth);

app.mount('#app');
