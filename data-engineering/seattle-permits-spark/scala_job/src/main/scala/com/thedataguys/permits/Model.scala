package com.thedataguys.permits

import java.sql.Date

/** The slice of the silver contract this job needs, as a typed record. */
final case class Permit(
    permitNum: String,
    permitType: String,
    permitTypeDesc: Option[String],
    appliedYear: Option[Int],
    issuedDate: Option[Date],
    daysToIssue: Option[Long],
    reviewCycles: Option[Long],
    housingUnitsAdded: Option[Long],
    housingUnitsRemoved: Option[Long],
    zip: Option[String]
)

final case class CycleTime(
    permit_type: String,
    permit_type_desc: Option[String],
    applied_year: Int,
    issued_permits: Long,
    p50_days_to_issue: Double,
    p90_days_to_issue: Double,
    avg_review_cycles: Option[Double]
)

final case class HousingYear(
    zip: String,
    issued_year: Int,
    housing_permits: Long,
    units_added: Long,
    units_removed: Long,
    net_units: Long,
    cumulative_net_units: Long
)
