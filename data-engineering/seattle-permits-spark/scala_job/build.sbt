ThisBuild / scalaVersion := "2.12.20"
ThisBuild / organization := "com.thedataguys"
ThisBuild / version      := "1.0.0"

val sparkVersion = "3.5.3"

lazy val root = (project in file("."))
  .settings(
    name := "seattle-permits-spark",
    libraryDependencies ++= Seq(
      "org.apache.spark" %% "spark-sql" % sparkVersion % Provided,
      "org.scalatest"    %% "scalatest" % "3.2.19"     % Test
    ),
    Compile / run / fork := true,
    Test / fork := true,
    javaOptions ++= Seq("-Xmx3g", "--add-exports=java.base/sun.nio.ch=ALL-UNNAMED")
  )
