import * as R from 'ramda'
import { CITYS, CLOUD_PROVIDERS_MAP } from '@/constants'

// const Select = {
//   name: 'Select',
//   methods: {
//     filterOption (input, option) {
//       return (
//         option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
//       )
//     },
//   },
//   render (h) {
//     const children = this.$slots.default
//     return (
//       <a-select allowClear showSearch filterOption={this.filterOption} onChange={() => this.$emit('change')}>
//         {children}
//       </a-select>
//     )
//   },
// }

export default {
  name: 'AreaSelects',
  inject: ['form'],
  props: {
    label: {
      type: String,
      default: '区域',
    },
    names: {
      type: Array,
      default: () => {
        return ['city', 'provider', 'cloudregion', 'zone']
      },
    },
    cityFetchSuccess: {
      type: Function,
    },
    providerFetchSuccess: {
      type: Function,
    },
    cloudregionFetchSuccess: {
      type: Function,
    },
    zoneFetchSuccess: {
      type: Function,
    },
    labelCol: {
      type: Object,
      default: () => {
        return {
          span: 24,
        }
      },
    },
    wrapperCol: {
      type: Object,
      default: () => {
        return {
          span: 24,
        }
      },
    },
  },
  created () {
    this.fetchs()
  },
  data () {
    return {
      cityLoading: false,
      cityList: [],
      providerLoading: false,
      providerList: [],
      cloudregionLoading: false,
      cloudregionList: [],
      zoneLoading: false,
      zoneList: [],
    }
  },
  computed: {
    FC () {
      if (this.form && this.form.fc) {
        return this.form.fc
      }
      return this.$form.createForm(this)
    },
    formItemLayout () {
      return {
        labelCol: this.labelCol,
        wrapperCol: this.wrapperCol,
      }
    },
    colSpan () {
      return 24 / this.names.length
    },
  },
  methods: {
    filterOption (input, option) {
      return (
        option.componentOptions.children[0].text.toLowerCase().indexOf(input.toLowerCase()) >= 0
      )
    },
    firstName (name) {
      return name.replace(/^\S/, s => s.toUpperCase())
    },
    resetValues (names) {
      const { setFieldsValue } = this.FC
      const nameObj = {}
      names.forEach(key => {
        nameObj[key] = undefined
      })
      setFieldsValue(nameObj)
    },
    getSelectedValue (key, id) {
      const list = (this[`${key}List`] && this[`${key}List`].length > 0) ? this[`${key}List`] : []
      return list.find(item => {
        return item.id === id || item.name === id
      })
    },
    handleChange (selectItem = {}, callback) {
      const key = Object.keys(selectItem)[0]
      const { id, fetchNames } = { ...selectItem[key] }
      const selectedValue = this.getSelectedValue(key, id)
      if (fetchNames && fetchNames.length > 0) {
        this.resetValues(fetchNames)
        this.$nextTick(() => {
          this.fetchs(fetchNames)
        })
      }
      this.$emit('change', {
        [key]: {
          id,
          value: selectedValue,
        },
      })
      callback && callback(selectedValue)
    },
    async fetchChange (name, list) {
      const events = this._events || {}
      const changes = events[`${name}FetchSuccess`]
      if (changes && changes.length > 0) {
        changes.forEach(e => {
          e(list)
        })
      } else {
        const _item = !R.isEmpty(list) ? list[0] : {}
        this.FC.setFieldsValue({
          [name]: _item.id || _item.name,
        })
      }
    },
    async fetchs (fetchNames = this.names) {
      if (fetchNames && fetchNames.length > 0) {
        for (let i = 0; i < fetchNames.length; i++) {
          const name = fetchNames[i]
          const sn = this.firstName(name)
          const fetchFn = this[`fetch${sn}`]
          if (this.names.indexOf(name) > -1 && fetchFn) {
            const list = await fetchFn()
            await this.fetchChange(name, list)
          }
        }
      }
    },
    async fetchCity () {
      const params = {
        usable: true,
      }
      this.cityLoading = true
      try {
        const manager = new this.$Manager('cloudregions', 'v2')
        const { data = [] } = await manager.rpc({
          methodname: 'getRegionCities',
          params,
        })
        this.cityLoading = false
        this.cityList = data
        return data
      } catch (err) {
        this.cityLoading = true
        throw err
      }
    },
    RenderCity () {
      const fetchNames = ['provider', 'cloudregion', 'zone']
      const _handleChange = (id) => {
        this.handleChange({
          city: {
            id,
            fetchNames,
          },
        })
      }
      return (
        <a-select allowClear showSearch filterOption={this.filterOption} onChange={_handleChange} loading={this.cityLoading} placeholder="请选择城市">
          {this.cityList.map(city => {
            const { id, name } = city
            return <a-select-option key={id} value={name}>{CITYS[name] || name}</a-select-option>
          })}
        </a-select>
      )
    },
    async fetchProvider () {
      const { getFieldsValue } = this.FC
      const { city } = getFieldsValue(this.names)
      const params = {
        usable: true,
        city,
      }
      this.providerLoading = true
      try {
        const manager = new this.$Manager('cloudregions', 'v2')
        const { data = [] } = await manager.rpc({
          methodname: 'getRegionProviders',
          params,
        })
        this.providerLoading = false
        this.providerList = data
        return data
      } catch (err) {
        this.providerLoading = true
        throw err
      }
    },
    RenderProvider () {
      const fetchNames = ['cloudregion', 'zone']
      const _handleChange = (id) => {
        this.handleChange({
          provider: {
            id,
            fetchNames,
          },
        })
      }
      return (
        <a-select allowClear showSearch filterOption={this.filterOption} onChange={_handleChange} loading={this.providerLoading} placeholder="请选择平台">
          {this.providerList.map(provider => {
            const { name } = provider
            return <a-select-option key={name} value={name}>{CLOUD_PROVIDERS_MAP[name] || name}</a-select-option>
          })}
        </a-select>
      )
    },
    async fetchCloudregion () {
      const { getFieldsValue } = this.FC
      const { city, provider } = getFieldsValue(this.names)
      const params = {
        usable: true,
        city,
        provider,
      }
      this.cloudregionLoading = true
      try {
        const manager = new this.$Manager('cloudregions', 'v2')
        const { data = {} } = await manager.list({ params })
        const retList = !R.isEmpty(data.data) ? data.data : []
        this.cloudregionLoading = false
        this.cloudregionList = retList
        return retList
      } catch (err) {
        this.cloudregionLoading = false
        throw err
      }
    },
    RenderCloudregion () {
      const fetchNames = ['zone']
      const { setFieldsValue } = this.FC
      const _callback = (item = {}) => {
        const { city, provider } = item
        setFieldsValue({
          city,
          provider,
        })
      }
      const _handleChange = (id) => {
        this.handleChange({
          cloudregion: {
            id,
            fetchNames,
          },
        }, _callback)
      }
      return (
        <a-select allowClear showSearch filterOption={this.filterOption} onChange={_handleChange} loading={this.cloudregionLoading} placeholder="请选择区域">
          {this.cloudregionList.map(cloudregion => {
            const { id, name } = cloudregion
            return <a-select-option key={id} value={id}>{name}</a-select-option>
          })}
        </a-select>
      )
    },
    async fetchZone () {
      const { getFieldsValue } = this.FC
      const { city, provider, cloudregion } = getFieldsValue(this.names)
      const params = {
        usable: true,
        city,
        provider,
        cloudregion,
      }
      this.zoneLoading = true
      try {
        const manager = new this.$Manager('zones', 'v2')
        const { data = {} } = await manager.list({
          params,
        })
        const retList = !R.isEmpty(data.data) ? data.data : []
        this.zoneLoading = false
        this.zoneList = retList
        return retList
      } catch (err) {
        this.zoneLoading = false
        throw err
      }
    },
    RenderZone () {
      const _callback = (item = {}) => {
        // eslint-disable-next-line camelcase
        const { provider, cloudregion_id } = item
        this.FC.setFieldsValue({
          provider,
          cloudregion: cloudregion_id,
        })
      }
      const _handleChange = (id) => {
        this.handleChange({
          zone: {
            id,
          },
        }, _callback)
      }
      return (
        <a-select allowClear showSearch filterOption={this.filterOption} onChange={_handleChange} loading={this.regionLoading} placeholder="请选择可用区">
          {this.zoneList.map(zone => {
            const { id, name } = zone
            return <a-select-option key={id} value={id}>{name}</a-select-option>
          })}
        </a-select>
      )
    },
  },
  render (h) {
    const { getFieldDecorator } = this.FC
    const { names } = this
    const RenderCols = names.map(name => {
      const sn = this.firstName(name)
      if (this[`Render${sn}`]) {
        const Render = this[`Render${sn}`]()
        return <a-col span={this.colSpan}> {getFieldDecorator(name)(Render)} </a-col>
      }
      return null
    })
    return (
      <div>
        <a-form-item labelCol={this.labelCol} wrapperCol={this.wrapperCol} label={this.label}>
          <a-row gutter={8}>
            {RenderCols}
          </a-row>
        </a-form-item>
      </div>
    )
  },
}
