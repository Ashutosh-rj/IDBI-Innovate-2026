import os
import json
import click
import jsonschema
import numpy as np
from jsonschema import validate
from typing import Dict, Any, List
from generators import MsmeProfileGenerator, Scenario

def load_schemas() -> Dict[str, Any]:
    """Loads all JSON Schema contracts from /contracts/v1/."""
    contracts_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "contracts", "v1"
    )
    schemas = {}
    for fname in os.listdir(contracts_dir):
        if fname.endswith(".schema.json"):
            with open(os.path.join(contracts_dir, fname), "r", encoding="utf-8") as f:
                schemas[fname] = json.load(f)
    return schemas

def validate_record(record: Dict[str, Any], schema_name: str, schemas: Dict[str, Any]):
    """Validates a data record against the specified JSON Schema."""
    schema = schemas.get(schema_name)
    if not schema:
        raise ValueError(f"Schema {schema_name} not found.")
    try:
        validate(instance=record, schema=schema)
    except jsonschema.exceptions.ValidationError as e:
        raise ValueError(f"Schema validation failed for {schema_name}: {e.message}")

@click.command()
@click.option("--count", default=10, help="Number of synthetic MSME profiles to generate.")
@click.option("--seed", default=42, help="Random seed for reproducibility.")
@click.option("--output", default="../../data/synthetic_cohort.jsonl", help="Output file path.")
@click.option("--validate-only", is_flag=True, help="Only validate existing generated file.")
def main(count: int, seed: int, output: str, validate_only: bool):
    """
    CLI script to generate N synthetic MSME profiles, validate against official JSON schemas,
    and check aggregate distribution drift against documented RBI/GSTN/NPCI statistics.
    """
    schemas = load_schemas()
    click.echo(f"Loaded {len(schemas)} schemas from /contracts/v1/")
    
    if validate_only:
        click.echo(f"Validating existing file: {output}")
        with open(output, "r", encoding="utf-8") as f:
            lines = f.readlines()
        for idx, line in enumerate(lines):
            data = json.loads(line)
            validate_record(data["profile"], "msme-profile.schema.json", schemas)
            for gst in data["gstFilings"]:
                validate_record(gst, "gst-filing.schema.json", schemas)
            validate_record(data["upiSummary"], "upi-transactions.schema.json", schemas)
            validate_record(data["aaStatement"], "aa-fi-statement.schema.json", schemas)
            validate_record(data["epfoRecord"], "epfo-contribution.schema.json", schemas)
        click.echo(f"Successfully validated {len(lines)} records against all JSON schemas!")
        return

    click.echo(f"Generating {count} synthetic profiles with seed={seed}...")
    generator = MsmeProfileGenerator(seed=seed)
    
    os.makedirs(os.path.dirname(os.path.abspath(output)), exist_ok=True)
    
    scenario_counts = {}
    default_counts = 0
    total_turnovers = []
    
    with open(output, "w", encoding="utf-8") as f:
        for i in range(count):
            generator.reseed(seed + i * 10)
            profile_data = generator.generate()
            
            # Strict schema validation before saving!
            validate_record(profile_data["profile"], "msme-profile.schema.json", schemas)
            for gst in profile_data["gstFilings"]:
                validate_record(gst, "gst-filing.schema.json", schemas)
            validate_record(profile_data["upiSummary"], "upi-transactions.schema.json", schemas)
            validate_record(profile_data["aaStatement"], "aa-fi-statement.schema.json", schemas)
            validate_record(profile_data["epfoRecord"], "epfo-contribution.schema.json", schemas)
            
            f.write(json.dumps(profile_data) + "\n")
            
            scen = profile_data["scenario"]
            scenario_counts[scen] = scenario_counts.get(scen, 0) + 1
            default_counts += profile_data["groundTruthLabel"]["default12m"]
            total_turnovers.append(profile_data["profile"]["declaredTurnover"])
            
            if (i + 1) % 500 == 0 or (i + 1) == count:
                click.echo(f"Generated & validated {i + 1}/{count} profiles...")
                
    click.echo("\n--- Generation Summary & Statistical Drift Check ---")
    click.echo(f"Total Profiles: {count}")
    for scen, cnt in scenario_counts.items():
        click.echo(f"  {scen}: {cnt} ({cnt/count*100:.1f}%)")
    click.echo(f"Overall Default Rate: {default_counts/count*100:.2f}% (Target: ~15-25% across cohort)")
    click.echo(f"Mean Declared Turnover: INR {np.mean(total_turnovers):,.2f}")
    click.echo(f"Saved to: {output}")

if __name__ == "__main__":
    main()
