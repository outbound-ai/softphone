export enum TakeOverTypeEnum {
  none = 'none',
  browser = 'browser',
  dialed = 'dialed'
}

export interface ITakeOver {
  type: TakeOverTypeEnum
  phoneNumber: string | null
}

export const NoTakeOver: ITakeOver = {
  type: TakeOverTypeEnum.none,
  phoneNumber: null
}

export const BrowserTakeOver: ITakeOver = {
  type: TakeOverTypeEnum.browser,
  phoneNumber: null
}
