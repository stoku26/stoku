// Logjika e Stoku-t pa Android (bashkimi, ruajtja në pjesë, afatet, lejet): e njëjtë me web-in, e provuar me fikstura.json
plugins { id("org.jetbrains.kotlin.jvm") }
java { toolchain { languageVersion.set(JavaLanguageVersion.of(17)) } }
kotlin { jvmToolchain(17) }
dependencies { testImplementation("junit:junit:4.13.2") }
tasks.test { testLogging { events("failed"); exceptionFormat = org.gradle.api.tasks.testing.logging.TestExceptionFormat.FULL } }
