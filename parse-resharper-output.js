const fs = require( 'fs' );
const xml2js = require( 'xml2js' );

async function analyzeReport( reportText, basePath, pathPrefix ) {
    const reportJson = await xml2js.parseStringPromise( reportText );
    const issuesArr = reportJson.Report.Issues[ 0 ];
    if ( !issuesArr || issuesArr.length === 0 ) {
        console.log( 'No errors found' );
        return;
    }

    let issues = issuesArr.Project.flatMap( ( p ) => p.Issue.flatMap( ( i ) => i.$ ) );
    issues.forEach( ( i ) => {
        i.File = i.File.split( '\\' ).join( '/' );
    } );
    issues = issues.filter( ( i ) => i.File.startsWith( basePath ) && i.TypeId !== 'CSharpErrors' && i.TypeId !== 'CppCompilerErrors' );
    issues.forEach( ( i ) => {
        i.File = i.File.replace( basePath, '' );
    } );
    if ( issues.length === 0 ) {
        console.log( 'No errors found' );
        return;
    }

    const reportedIssues = new Set();
    for ( const issue of issues ) {
        const issueText = `::error file=${pathPrefix + issue.File},line=${issue.Line},col=${issue.Offset}::${issue.Message}`;
        if ( reportedIssues.has( issueText ) ) {
            continue;
        }
        reportedIssues.add( issueText );
        console.log( `${pathPrefix + issue.File}:${issue.Line}:` );
        console.log( issueText );
    }
    process.exit( 1 );
}

const [ _, __, reportFileName, basePath, pathPrefix = '' ] = process.argv;
const reportFileText = fs.readFileSync( reportFileName ).toString( 'utf-8' );
analyzeReport( reportFileText, basePath, pathPrefix );
