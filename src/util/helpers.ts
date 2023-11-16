export const dateParser = (date: Date): number => {
  return Date.parse(date.toString());
};

export const timeDifference = (time1: Date, time2: Date): number =>
  time1.getTime() - time2.getTime();

export const fifteenMinutesInMilliseconds = 15 * 60 * 1000;

export enum SearchFunctionEnums {
  EMAIL = "email",
  RECIPIENT = "recipient",
  KYCPASSED = "kycPassed",
  COMPANY_NAME = "companyName",
  SLUG = "slug",
  NAME = "name",
}

export enum fundingPoolsFilterEnum {
  ALL = "All",
  FINISHED_DEALS = "Finished Deals",
  UPCOMING_DEALS = "Upcoming Deals",
  LIVE_DEALS = "Live Deals",
}

export enum featuredPoolsFilterEnum {
  ALL = "All",
  ONGOING_FUNDING_POOLS = "Ongoing",
  UPCOMING_FUNDING_POOLS = "Upcoming",
}

export enum KycEventStatus {
  PROCESSED = "PROCESSED",
  CROSS_CHECKED = "CROSS_CHECKED",
  UPDATED = "UPDATED",
  REJECTED = "REJECTED",
}

export enum KycRequestStatus {
  AUTO_FINISH = "AUTO_FINISH",
  MANUAL_FINISH = "MANUAL_FINISH",
}
