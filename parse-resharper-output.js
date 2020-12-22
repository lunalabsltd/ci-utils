const fs = require( 'fs' );
const xml2js = require( 'xml2js' );

async function analyzeReport( reportText, basePath ) {
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
    issues = issues.filter( ( i ) => i.File.startsWith( basePath ) && i.TypeId !== 'CSharpErrors' );
    issues.forEach( ( i ) => {
        i.File = i.File.replace( basePath, '' );
    } );
    if ( issues.length === 0 ) {
        console.log( 'No errors found' );
        return;
    }

    for ( const issue of issues ) {
        console.log( `${issue.File}:${issue.Line}:` );
        console.log( `::error file=${issue.File},line=${issue.Line},col=${issue.Offset}::${issue.Message}` );
    }
    process.exit( 1 );
}

const [ _, __, reportFileName, basePath ] = process.argv;
const reportFileText = fs.readFileSync( reportFileName ).toString( 'utf-8' );
analyzeReport( reportFileText, basePath );
