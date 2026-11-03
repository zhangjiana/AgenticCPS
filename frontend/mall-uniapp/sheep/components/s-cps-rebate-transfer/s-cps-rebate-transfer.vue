<template>
  <view class="transfer-card" :style="panelStyle">
    <view class="transfer-title"
      ><text class="transfer-icon _icon-link" /><text>{{ content.title }}</text></view
    >
    <view class="transfer-description">{{ content.description }}</view>
    <view class="transfer-input-wrap">
      <textarea
        v-model="state.input"
        class="transfer-input"
        :placeholder="content.placeholder"
        :maxlength="500"
      />
      <view class="transfer-actions">
        <picker
          class="platform-picker"
          mode="selector"
          :range="platformOptions"
          range-key="label"
          :value="state.platformIndex"
          @change="onPlatformChange"
        >
          <view class="platform-picker-label">{{ selectedPlatformLabel }} ▾</view>
        </picker>
        <button class="ss-reset-button paste-button" @tap="pasteFromClipboard">粘贴链接</button>
      </view>
      <view class="transfer-platform-hint">{{ platformHint }}</view>
      <button class="ss-reset-button transfer-button" :disabled="state.loading" @tap="transfer">{{
        state.loading ? '处理中...' : content.buttonText
      }}</button>
    </view>
    <view v-if="state.result" class="transfer-result">
      <view class="result-goods-box">
        <image
          class="result-goods-img"
          :src="imageUrl(state.result)"
          mode="aspectFill"
          @error="state.result.imageFailed = true"
        />
        <view class="result-goods-info">
          <view class="result-title ss-line-2">{{ state.result.title || '已生成返利链接' }}</view>
          <view class="result-tags">
            <text class="result-platform-tag">{{ platformText(state.result.platformCode) }}</text>
            <text v-if="state.result.shopName" class="result-shop-name">{{ state.result.shopName }}</text>
          </view>
          <view class="result-price-row">
            <text class="result-actual-price">券后 ¥{{ money(state.result.actualPrice) }}</text>
            <text
              v-if="toNumber(state.result.originalPrice) > toNumber(state.result.actualPrice)"
              class="result-origin-price"
              >¥{{ money(state.result.originalPrice) }}</text
            >
          </view>
          <view class="result-benefit-row">
            <text v-if="toNumber(state.result.couponPrice) > 0" class="result-coupon-tag"
              >券 ¥{{ money(state.result.couponPrice) }}</text
            >
            <text v-else-if="state.result.couponInfo" class="result-coupon-tag"
              >{{ state.result.couponInfo }}</text
            >
            <text
              v-if="toNumber(state.result.estimateRebateAmount) > 0"
              class="result-rebate-tag"
              >预估返 ¥{{ money(state.result.estimateRebateAmount) }}</text
            >
            <text v-else-if="state.result.commissionRate" class="result-rebate-tag"
              >佣金 {{ state.result.commissionRate }}%</text
            >
          </view>
        </view>
      </view>
      <button class="ss-reset-button result-button" @tap="copyResult">复制推广链接</button>
      <button class="ss-reset-button result-button result-copy-rebate" @tap="copyRebateCopy"
        >复制返利文案</button
      >
    </view>
  </view>
</template>

<script setup>
  import { computed, reactive } from 'vue';
  import sheep from '@/sheep';
  import { showAuthModal } from '@/sheep/hooks/useModal';
  import CpsGoodsApi from '@/sheep/api/cps/goods';
  import { detectCpsPlatform } from '@/sheep/helper/cpsPlatform';
  import {
    copyPromotionValue,
    formatMoney,
    platformText,
    toNumber,
  } from '@/sheep/helper/cps';

  const props = defineProps({
    data: { type: Object, default: () => ({}) },
    styles: { type: Object, default: () => ({}) },
  });
  const content = computed(() => ({
    title: props.data.title || '一键转链',
    description: props.data.description || '粘贴商品链接或口令，生成专属返利链接',
    placeholder: props.data.placeholder || '粘贴商品链接、商品 ID 或口令',
    buttonText: props.data.buttonText || '立即转链',
    platformCode: props.data.platformCode || 'auto',
  }));
  const platformOptions = [
    { label: '自动识别', value: 'auto' },
    { label: '淘宝', value: 'taobao' },
    { label: '京东', value: 'jd' },
    { label: '拼多多', value: 'pdd' },
    { label: '抖音', value: 'douyin' },
  ];
  const state = reactive({ input: '', loading: false, result: null, platformIndex: 0 });
  const selectedPlatformLabel = computed(() => platformOptions[state.platformIndex].label);
  const platformHint = computed(() => {
    if (state.platformIndex !== 0) return `当前已选择${selectedPlatformLabel.value}`;
    const code = detectCpsPlatform(state.input);
    return code ? `已识别为${platformText(code)}` : '无法识别的平台可手动选择';
  });
  function onPlatformChange(event) {
    state.platformIndex = Number(event.detail.value);
    state.result = null;
  }
  function pasteFromClipboard() {
    uni.getClipboardData({
      success: ({ data }) => {
        const value = String(data || '').trim();
        if (!value) {
          sheep.$helper.toast('剪贴板为空');
          return;
        }
        state.input = value.slice(0, 500);
        state.result = null;
      },
      fail: () => sheep.$helper.toast('读取剪贴板失败，请手动粘贴'),
    });
  }
  function resolvePlatformCode(originalContent) {
    const selected = platformOptions[state.platformIndex].value;
    if (selected !== 'auto') return selected;
    return detectCpsPlatform(originalContent) ||
      (content.value.platformCode !== 'auto' ? content.value.platformCode : '');
  }
  const panelStyle = computed(() => ({
    borderRadius: `${Number(props.styles.borderRadius || 8)}px`,
  }));
  const money = (value) => formatMoney(value);
  function imageUrl(item) {
    return item?.imageFailed ? '/static/goods-empty.png' : item?.mainPic || '/static/goods-empty.png';
  }
  async function transfer() {
    const originalContent = state.input.trim();
    if (!originalContent || state.loading) return;
    const platformCode = resolvePlatformCode(originalContent);
    if (!platformCode) {
      sheep.$helper.toast('无法识别商品平台，请手动选择');
      return;
    }
    if (!sheep.$store('user').isLogin) {
      showAuthModal();
      return;
    }
    state.loading = true;
    state.result = null;
    try {
      const parsed = await CpsGoodsApi.parseContent({
        platformCode,
        originalContent,
      });
      if (parsed?.code !== 0 || !parsed.data?.supported) {
        sheep.$helper.toast(parsed?.data?.failureReason || '暂不支持该商品内容');
        return;
      }
      const linked = await CpsGoodsApi.generateLink({
        platformCode: parsed.data.platformCode || platformCode,
        goodsId: parsed.data.goodsId,
        goodsSign: parsed.data.goodsSign,
        originalContent,
      });
      if (linked?.code !== 0 || !linked.data) {
        sheep.$helper.toast('生成推广链接失败，请重试');
        return;
      }
      state.result = {
        ...parsed.data,
        ...linked.data,
        title: linked.data?.title || parsed.data?.title,
        mainPic: linked.data?.mainPic || parsed.data?.mainPic,
        actualPrice: linked.data?.actualPrice || parsed.data?.actualPrice,
        originalPrice: linked.data?.originalPrice || parsed.data?.originalPrice,
        couponPrice: linked.data?.couponPrice || parsed.data?.couponPrice,
        estimateRebateAmount:
          linked.data?.estimateRebateAmount || parsed.data?.estimateRebateAmount,
      };
    } catch (error) {
      sheep.$helper.toast('转链失败，请稍后重试');
    } finally {
      state.loading = false;
    }
  }
  async function copyResult() {
    const value = state.result?.promotionUrl || state.result?.mobileUrl ||
      state.result?.shortUrl || state.result?.longUrl || state.result?.tpwd;
    if (!value) return;
    await copyPromotionValue(value);
    sheep.$helper.toast('推广链接已复制');
  }
  async function copyRebateCopy() {
    const result = state.result;
    if (!result) return;
    const value = result.promotionUrl || result.mobileUrl || result.shortUrl || result.longUrl || result.tpwd || '';
    const hasOrigin = toNumber(result.originalPrice) > toNumber(result.actualPrice);
    const lines = [
      result.title || '精选商品',
      `【券后价】¥${money(result.actualPrice)}` + (hasOrigin ? ` (原价¥${money(result.originalPrice)})` : ''),
      toNumber(result.couponPrice) > 0 ? `【优惠券】¥${money(result.couponPrice)}` : '',
      toNumber(result.estimateRebateAmount) > 0
        ? `【预估返利】¥${money(result.estimateRebateAmount)}`
        : (result.commissionRate ? `【佣金率】${result.commissionRate}%` : ''),
      value,
    ].filter(Boolean);
    await copyPromotionValue(lines.join('\n'));
    sheep.$helper.toast('返利文案已复制');
  }
</script>

<style lang="scss" scoped>
  .transfer-card {
    padding: 22rpx 24rpx 26rpx;
    background: #fff;
  }
  .transfer-title {
    display: flex;
    align-items: center;
    gap: 12rpx;
    color: #202226;
    font-size: 30rpx;
    font-weight: 700;
  }
  .transfer-icon {
    font-size: 30rpx;
  }
  .transfer-description {
    margin-top: 10rpx;
    color: #8c8c8c;
    font-size: 23rpx;
  }
  .transfer-input-wrap {
    margin-top: 20rpx;
    padding: 16rpx;
    border: 1rpx solid #e7e9eb;
    border-radius: 18rpx;
    background: #fafbfb;
  }
  .transfer-input {
    width: 100%;
    min-height: 104rpx;
    box-sizing: border-box;
    color: #333;
    font-size: 25rpx;
    line-height: 1.55;
  }
  .transfer-actions {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-top: 12rpx;
  }
  .platform-picker {
    flex: 1;
    min-width: 0;
  }
  .platform-picker-label {
    padding: 16rpx;
    border: 1rpx solid #d9e2df;
    border-radius: 12rpx;
    color: #334155;
    font-size: 24rpx;
    text-align: center;
  }
  .paste-button {
    flex: 1;
    height: 62rpx;
    border-radius: 12rpx;
    background: #eaf8f0;
    color: #068448;
    font-size: 24rpx;
    line-height: 62rpx;
  }
  .transfer-platform-hint {
    margin-top: 10rpx;
    color: #728079;
    font-size: 21rpx;
  }
  .transfer-button {
    width: 100%;
    height: 76rpx;
    margin-top: 14rpx;
    border-radius: 38rpx;
    color: #fff;
    background: linear-gradient(90deg, #09bc68, #00d475);
    box-shadow: 0 8rpx 20rpx rgba(0, 190, 106, 0.2);
    font-size: 26rpx;
    font-weight: 650;
    line-height: 76rpx;
  }
  .transfer-result {
    margin-top: 18rpx;
    padding: 18rpx;
    border-radius: 12rpx;
    background: #edfaf4;
  }
  .result-goods-box {
    display: flex;
    gap: 16rpx;
    margin-bottom: 12rpx;
  }
  .result-goods-img {
    flex: 0 0 136rpx;
    width: 136rpx;
    height: 136rpx;
    border-radius: 10rpx;
    background: #e8f5ee;
  }
  .result-goods-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .result-title {
    color: #202226;
    font-size: 25rpx;
    font-weight: 600;
    line-height: 33rpx;
  }
  .result-tags {
    display: flex;
    gap: 8rpx;
    margin-top: 4rpx;
  }
  .result-platform-tag {
    padding: 2rpx 8rpx;
    border-radius: 6rpx;
    background: #e6f7ff;
    color: #1890ff;
    font-size: 19rpx;
    font-weight: 600;
  }
  .result-shop-name {
    font-size: 20rpx;
    color: #999;
  }
  .result-price-row {
    display: flex;
    align-items: baseline;
    gap: 10rpx;
    margin-top: 6rpx;
  }
  .result-actual-price {
    color: #fa3534;
    font-size: 27rpx;
    font-weight: 700;
  }
  .result-origin-price {
    color: #bbb;
    font-size: 19rpx;
    text-decoration: line-through;
  }
  .result-benefit-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8rpx;
    margin-top: 6rpx;
  }
  .result-coupon-tag {
    padding: 2rpx 8rpx;
    border: 1rpx solid #fa3534;
    border-radius: 6rpx;
    color: #fa3534;
    font-size: 18rpx;
  }
  .result-rebate-tag {
    padding: 2rpx 8rpx;
    border-radius: 6rpx;
    background: #fff0e6;
    color: #ff6600;
    font-size: 18rpx;
    font-weight: 600;
  }
  .result-button {
    height: 58rpx;
    margin-top: 14rpx;
    border: 1rpx solid #08b96a;
    border-radius: 29rpx;
    color: #08a960;
    background: #fff;
    font-size: 23rpx;
    line-height: 56rpx;
  }
  .result-copy-rebate {
    margin-top: 10rpx;
    color: #fff;
    background: #08b96a;
  }
</style>
