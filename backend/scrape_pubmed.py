import sys
sys.path.insert(0, '/app')

import requests
import time
from xml.etree import ElementTree as ET
from app.database import SessionLocal
from app.models import Study

# PubMed E-utilities base URLs
ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
EFETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"

def search_pubmed(query, max_results=100):
    """Search PubMed and return list of PMIDs"""
    params = {
        'db': 'pubmed',
        'term': query,
        'retmax': max_results,
        'retmode': 'json',
        'sort': 'relevance'
    }
    
    response = requests.get(ESEARCH_URL, params=params)
    response.raise_for_status()
    data = response.json()
    
    pmids = data.get('esearchresult', {}).get('idlist', [])
    print(f"Found {len(pmids)} studies matching: {query}")
    return pmids

def fetch_study_details(pmids):
    """Fetch detailed information for a list of PMIDs"""
    if not pmids:
        return []
    
    # PubMed API recommends batches of 200 or fewer
    batch_size = 200
    all_studies = []
    
    for i in range(0, len(pmids), batch_size):
        batch = pmids[i:i + batch_size]
        pmid_str = ','.join(batch)
        
        params = {
            'db': 'pubmed',
            'id': pmid_str,
            'retmode': 'xml'
        }
        
        print(f"Fetching details for PMIDs {i+1} to {min(i+batch_size, len(pmids))}...")
        response = requests.get(EFETCH_URL, params=params)
        response.raise_for_status()
        
        # Parse XML response
        root = ET.fromstring(response.content)
        studies = parse_pubmed_xml(root)
        all_studies.extend(studies)
        
        # Be nice to PubMed API - rate limit
        time.sleep(0.5)
    
    return all_studies

def parse_pubmed_xml(root):
    """Parse PubMed XML response and extract study information"""
    studies = []
    
    for article in root.findall('.//PubmedArticle'):
        try:
            # Extract title
            title_elem = article.find('.//ArticleTitle')
            title = ''.join(title_elem.itertext()) if title_elem is not None else "No title"
            
            # Extract authors
            author_list = article.findall('.//Author')
            authors = []
            for author in author_list[:10]:  # Limit to first 10 authors
                last_name = author.find('LastName')
                initials = author.find('Initials')
                if last_name is not None:
                    author_str = last_name.text
                    if initials is not None:
                        author_str += f" {initials.text}"
                    authors.append(author_str)
            authors_str = ', '.join(authors) if authors else None
            
            # Extract abstract
            abstract_elem = article.find('.//AbstractText')
            abstract = ''.join(abstract_elem.itertext()) if abstract_elem is not None else None
            
            # Extract publication year
            pub_date = article.find('.//PubDate/Year')
            pub_year = int(pub_date.text) if pub_date is not None else None
            
            # Extract journal
            journal_elem = article.find('.//Journal/Title')
            journal = journal_elem.text if journal_elem is not None else None
            
            # Extract DOI
            doi = None
            for article_id in article.findall('.//ArticleId'):
                if article_id.get('IdType') == 'doi':
                    doi = article_id.text
                    break
            
            # Extract PMID for URL
            pmid_elem = article.find('.//PMID')
            pmid = pmid_elem.text if pmid_elem is not None else None
            pdf_url = f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/" if pmid else None
            
            # Extract keywords/mesh terms
            mesh_terms = article.findall('.//MeshHeading/DescriptorName')
            keywords = ', '.join([term.text for term in mesh_terms[:10]]) if mesh_terms else None
            
            study_data = {
                'title': title,
                'authors': authors_str,
                'abstract': abstract,
                'publication_year': pub_year,
                'journal': journal,
                'doi': doi,
                'pdf_url': pdf_url,
                'keywords': keywords
            }
            
            studies.append(study_data)
            
        except Exception as e:
            print(f"Error parsing article: {e}")
            continue
    
    return studies

def save_studies_to_db(studies):
    """Save studies to database, skipping duplicates"""
    db = SessionLocal()
    added = 0
    skipped = 0
    
    for study_data in studies:
        try:
            # Check if study already exists (by DOI or title)
            existing = None
            if study_data['doi']:
                existing = db.query(Study).filter(Study.doi == study_data['doi']).first()
            
            if not existing and study_data['title']:
                existing = db.query(Study).filter(Study.title == study_data['title']).first()
            
            if existing:
                skipped += 1
                continue
            
            # Create new study
            study = Study(**study_data)
            db.add(study)
            db.commit()
            added += 1
            
        except Exception as e:
            print(f"Error saving study: {e}")
            db.rollback()
            continue
    
    db.close()
    return added, skipped

def main():
    """Main function to scrape and save studies"""
    
    # Define search queries for hypertrophy research
    queries = [
        'muscle hypertrophy resistance training',
        'muscle growth strength training',
        'skeletal muscle hypertrophy mechanisms',
        'resistance training volume hypertrophy',
        'resistance training frequency hypertrophy',
        'muscle protein synthesis resistance exercise',
    ]
    
    all_pmids = set()
    
    print("=" * 60)
    print("PubMed Hypertrophy Study Scraper")
    print("=" * 60)
    
    # Search for studies
    for query in queries:
        pmids = search_pubmed(query, max_results=50)
        all_pmids.update(pmids)
        time.sleep(0.5)  # Rate limiting
    
    print(f"\nTotal unique studies found: {len(all_pmids)}")
    
    # Fetch detailed information
    print("\nFetching study details...")
    studies = fetch_study_details(list(all_pmids))
    print(f"Successfully parsed {len(studies)} studies")
    
    # Save to database
    print("\nSaving to database...")
    added, skipped = save_studies_to_db(studies)
    
    print("\n" + "=" * 60)
    print(f"Added: {added} new studies")
    print(f"Skipped: {skipped} duplicates")
    print(f"Total in database: {added + skipped}")
    print("=" * 60)

if __name__ == "__main__":
    main()