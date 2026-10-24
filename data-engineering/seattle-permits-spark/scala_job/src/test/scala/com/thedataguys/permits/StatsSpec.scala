package com.thedataguys.permits

import org.scalatest.funsuite.AnyFunSuite

class StatsSpec extends AnyFunSuite {
  test("median of an even-length sequence interpolates") {
    assert(Stats.percentile(Seq(1L, 2L, 3L, 4L), 0.5) == 2.5)
  }
  test("p90 interpolates between closest ranks") {
    assert(math.abs(Stats.percentile(1L to 10L, 0.9) - 9.1) < 1e-9)
  }
  test("single value") {
    assert(Stats.percentile(Seq(42L), 0.9) == 42.0)
  }
  test("order does not matter") {
    assert(Stats.percentile(Seq(9L, 1L, 5L), 0.5) == 5.0)
  }
  test("rejects empty input and bad q") {
    assertThrows[IllegalArgumentException](Stats.percentile(Seq.empty, 0.5))
    assertThrows[IllegalArgumentException](Stats.percentile(Seq(1L), 1.5))
  }
}
